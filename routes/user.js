'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted

var openUser = require('../models/user.js');
var quesS = require('../models/questionS.js');
var mailer = require('../mailer.js');

router.route('/')
.get(function(req, res, next){                  // Give all keywords in ascending order
    
    openUser.find().sort('-important_date.registration').limit(200)
    .exec(function(err, user){
        if(err)
            return next(err);
        res.status(200).json(user);
    });
})

.post(function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
//	openUser.collection.getIndexes({full: true}).then(indexes => {
//		console.log("indexes:", indexes);
//		openUser.collection.dropIndexes().then(indexes => {
//		console.log("indexes:", indexes);});
//		// ...
//	}).catch(console.error);
	
    body.important_date = {registration: new Date()};
	
	openUser.findOne({emailID: body.emailID}, {emailID: true})
	.exec(function(err, u){
		if(err)
			return next(err);
		else if(u)
			return res.status(200).json({id: u._id, message: "Done"});
		else
			quesS.find()
			.exec(function(err, qu){
				if(err)
					return next(err);
				
				body.questionnaire = qu;
				
				openUser.create(body, function(err, user){
					if(err)
						return next(err);
					return res.status(200).json({id: user._id, message: "Done"});
				});
			});
	});
});

router.route('/:id')
.get(function(req, res, next){                  // Give all keywords in ascending order
    
    openUser.findById(sanitize(req.params.id), {'personal_info.fullname': true, questionnaire: true, profile: true, polarities: true, 'peer_reviews.recommendation': true, 'peer_reviews.last_modified': true, 'peer_reviews.emailid': true, 'peer_reviewers.name': true, 'peer_reviewers.emailid': true})
    .exec(function(err, user){
        if(err)
            return next(err);
        res.status(200).json(user);
    });
})

.put(function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    openUser.findOneAndUpdate({_id: sanitize(req.params.id)}, {$set: req.body}, {new: true})
    .exec(function(err, user){
        if(err)
            return next(err);
        return res.status(200).json({message: "Done"});
    });

});

router.route('/reviewers/:id')
.post(function(req, res, next){
    var body = sanitize(req.body);
	
    openUser.findOne({_id: sanitize(req.params.id)}, {'personal_info.fullname': true, peer_reviewers: true})
    .exec(function(err, user){
        if(err)
            return next(err);
		
		var mailData = {to: []};
		var curDate = new Date();
		body.forEach(function(v, i){
			body[i].date = curDate;
			mailData.to.push(body[i].emailid);
			user.peer_reviewers.push(body[i]);
		});
		
		var link = "idiscover-automation.herokuapp.com/#/peer-endorsement/"+user._id;
		mailData.subject = "iDiscover.me | Request to Endorse "+user.personal_info.fullname+"'s Profile";
		mailData.html = 'Hello,<br> Please click on the link below to start reviewing '+user.personal_info.fullname+'\'s Profile .<br><a href='+link+'>Start Endorsement</a>';
		
		user.save(function(e, u){
			if(e)
				return next(e);
			else{
				mailer.custom_mail(mailData, function(ret){
					var res_from_mailer = ret;
					//console.log(res_from_mailer);

					if(res_from_mailer == false){
						//console.log('Updated error!');
						return res.status(501).json({ success: false, message: 'Some Error Occured !' });
					}
					else if(res_from_mailer == true){
						//console.log('Updated token!');
						res.status(200).json({success: true, message: "Mail Sent to Reviewers Successfully !"});
					}
				});
			}
		});
    });
});

router.route('/peer_check/:id')
.post(function(req, res, next){
    var id = sanitize(req.params.id);
	var eid = sanitize(req.body.eid);
    
    openUser.findOne({_id: id}, {'peer_reviewers': true})
    .exec(function(err, user){
        if(err)
            return next(err);
		
		if(!user)
			return res.status(200).json({success: false, message: "User Doesn't Exists !"});
		
		var found = true;
		if(user.peer_reviewers.length != 0){
			
			for(var i=0; i<user.peer_reviewers.length; i++){
				
				if(user.peer_reviewers[i].emailid == eid){
					found = true;
					
					return res.status(200).json({success: true, message: "Successfully Verified !"});
					break;
				}
				else if(((user.peer_reviewers.length-1) == i) && !found){
					
					return res.status(200).json({success: false, message: "Email-ID Not Found !"});
					break;
				}
				else
					found = false;
			}
		}
		else if(user.peer_reviewers.length == 0)
        	return res.status(200).json({success: false, message: "Email-ID Not Found !"});
		if(!found)
			return res.status(200).json({success: false, message: "Email-ID Not Found !"});
    });
});

router.route('/peer/:id/:eid')
.get(function(req, res, next){
    var id = sanitize(req.params.id);
    var eid = sanitize(req.params.eid);
    
    openUser.findOne({_id: id}, {'polarities': true, peer_reviews: true, 'personal_info.fullname': true, 'profile.eachSectionStopReflect': true})
    .exec(function(err, user){
        if(err)
            return next(err);
		else{
			var fname = user.personal_info.fullname;
			var plr = user.polarities;
			var sr = user.profile.eachSectionStopReflect;
			
			for(var k=0; k < user.peer_reviews.length; k++){
				if(user.peer_reviews[k].emailid == eid){
					var to_send = {};
					
					to_send.fullname = fname;
					to_send.polarities = plr;
					to_send.eachSectionStopReflect = sr;
					to_send.peer_reviewer_number = k;
					to_send.peer_reviewer_data = user.peer_reviews[to_send.peer_reviewer_number];
					
					return res.status(200).json(to_send);
					break;
				}
			}
			//console.log("k: "+user.peer_reviews.length);
			
			var revs = [];
			for(var s=0; s < user.polarities.length; s++){
				revs[s] = new Array(3);
				revs[s][0] = user.polarities[s].polar_id;
				revs[s][1] = false;
				revs[s][2] = false;
			}
				
			user.peer_reviews.push({
				emailid: eid,
				reviews: revs,
				date: new Date()
			});
			
			user.save(function(er, us){
				if(er)
					return next(er);
				else{
					var to_send = {};
					
					to_send.fullname = fname;
					to_send.polarities = plr;
					to_send.eachSectionStopReflect = sr;
					to_send.peer_reviewer_number = k;
					to_send.peer_reviewer_data = us.peer_reviews[to_send.peer_reviewer_number];
					
					return res.status(200).json(to_send);
				}
			});
			
		}
    });
});

router.route('/peer_submit/:id/:peer_index')
.post(function(req, res, next){
    var id = sanitize(req.params.id);
	var pi = sanitize(req.params.peer_index);
	var body = sanitize(req.body);
	
    openUser.findOne({_id: id}, {'peer_reviews': true, 'polarities': true})
    .exec(function(err, user){
        if(err)
            return next(err);

		user.polarities = body.polarities;
		user.peer_reviews[pi].reviews = body.reviewer_data.reviews;
		user.peer_reviews[pi].recommendation = body.reviewer_data.recommendation;
		user.peer_reviews[pi].last_modified = new Date();
		
		user.save(function(e, u){
			if(e)
				return next(err);
			else{
				return res.status(200).json({success: true, message: "Review Submitted !"});
			}
		});
    });
});

module.exports = router;