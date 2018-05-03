'use strict';

var express = require('express');
var router = express.Router();

var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('./models/user');
var config = require('./config');
var Verify = require('./routes/verify');
var jwt = require('jsonwebtoken');

// Load environment
const _ENV_NAME = process.env.NAME || 'development';
config = config[_ENV_NAME];

//exports = passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var getDetails = {
    username: null,
    _id: null,
    admin: false,
    facilitator: false
};

exports = passport.use(new GoogleStrategy({  
    clientID: config.googleAuth.clientID,
    clientSecret: config.googleAuth.clientSecret,
    callbackURL: config.googleAuth.callbackURL,
  },
    function(token, refreshToken, profile, done) {
    //console.log(profile);
      process.nextTick(function() {
        User.findOne({$or: [{'OauthId': profile.id}, {'username': profile.emails[0].value}]}, function(err, user) {
            //console.log("\nFINDING USER");
          if (err)
            return done(err);        
          if (user) {
			  	//console.log("\nFOUND USER");              
            
				getDetails.user = profile.emails[0].value;
				getDetails._id = user._id;
				getDetails.admin = false;
				//console.log(getDetails);

				return done(null, user);
          } else {
			  	//console.log("\nREGISTERING USER");
				var newUser = new User();
				newUser.OauthId = profile.id;
				newUser.OauthToken = token;
				var name = profile.displayName.split(' ');
				newUser.firstname = name[0];
			    name.splice(0,1);
			    newUser.lastname = name.join(' ');
				newUser.username = profile.emails[0].value;
				newUser.username_verified = true;
				newUser.important_date.registration = new Date();

				newUser.save(function(err) {
					if (err)
						throw err;

					getDetails.user = profile.emails[0].value;
					getDetails._id = newUser._id;
					getDetails.admin = false;
					//console.log(getDetails);

					return done(null, newUser);
				});
          }
        });
      });
    }));

exports.makeToken = function() {
	return Verify.getToken(getDetails);
};

module.exports = exports;