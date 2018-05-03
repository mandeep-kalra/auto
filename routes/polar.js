var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');

var Verify = require('./verify');
var Types = require('../models/polar');

var quesRouter = express.Router();

quesRouter.use(bodyParser.json());

/* Route '/' */

quesRouter.route('/')
.get(function (req, res, next) {
    Types.find().sort('polar_id')
        .exec(function (err, type) {
        if (err) 
			return next(err);
        res.json(type);
    });
})

.post(function (req, res, next) {
    Types.create(req.body, function (err, type) {
        if (err) throw err;
        //console.log('Heading created!');
        
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });

        res.end('Added');
    });
})

.delete(function (req, res, next) {
    Types.remove({}, function (err, resp) {
        if (err) throw err;
        res.json(resp);
    });
});

quesRouter.route('/:typeId')
.get(function (req, res, next) {
    Types.findById(req.params.typeId)
        .exec(function (err, type) {
        if (err) next(err);
        res.json(type);
    });
})

.put(function (req, res, next) {
	//console.log(req.body);
    Types.findByIdAndUpdate(req.params.typeId, {$set: req.body}, {new: true}, function (err, type) {
        if (err) throw err;
		//console.log(type);
        res.json(type);
    });
})

.delete(function (req, res, next) {
        Types.findByIdAndRemove(req.params.typeId, function (err, resp) {
        if (err) throw err;
        res.json(resp);
    });
});

quesRouter.route('/:typeId/keywords')

.get(function (req, res, next) {
    Types.findById(req.params.typeId)
        .populate('keywords.postedBy')
        .exec(function (err, type) {
        if (err) next(err);
        res.json(type.keywords);
    });
})

.post(Verify.verifyOrdinaryUser,function (req, res, next) {
    Types.findById(req.params.typeId, function (err, type) {
        if (err) next(err);
        req.body.postedBy = req.decoded._id;
        type.keywords.push(req.body);
        type.save(function (err, type) {
            if (err) throw err;
            console.log('Updated keywords!');
            res.json(type);
        });
    });
})

.delete(Verify.verifyOrdinaryUser,Verify.verifyAdmin, function (req, res, next) {
    Types.findById(req.params.typeId, function (err, type) {
        if (err) throw err;
        for (var i = (type.keywords.length - 1); i >= 0; i--) {
            type.keywords.id(type.keywords[i]._id).remove();
        }
        type.save(function (err, result) {
            if (err) throw err;
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end('Deleted all keywords!');
        });
    });
});

quesRouter.route('/:typeId/keywords/:keyId')
.get(Verify.verifyOrdinaryUser,function (req, res, next) {
    Types.findById(req.params.typeId)
        .populate('keywords.postedBy')
        .exec(function (err, type) {
        if (err) next(err);
        res.json(type.keywords.id(req.params.keyId));
    });
})

.put(Verify.verifyOrdinaryUser,function (req, res, next) {
    // We delete the existing commment and insert the updated
    // comment as a new comment
    Types.findById(req.params.typeId, function (err, type) {
        if (err) next(err);
        type.keywords.id(req.params.keyId).remove();
                req.body.postedBy = req.decoded._id;
        type.keywords.push(req.body);
        type.save(function (err, type) {
            if (err) throw err;
            console.log('Updated keywords!');
            res.json(type);
        });
    });
})

.delete(Verify.verifyOrdinaryUser,function (req, res, next) {
    Types.findById(req.params.typeId, function (err, type) {
        if (type.keywords.id(req.params.keyId).postedBy!= req.decoded._id) {
            var err = new Error('You are not authorized to perform this operation!');
            err.status = 403;
            return next(err);
        }
        type.keywords.id(req.params.keyId).remove();
        type.save(function (err, resp) {
            if (err) next(err);
            res.json(resp);
        });
    });
});


module.exports = quesRouter
