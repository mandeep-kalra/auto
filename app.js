'use strict';

//IMPORTING
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
//var fs = require('fs');
var logger = require('morgan');                     //HTTP request logger - will show requests in Command Prompt

var config = require('./config');

// Load environment
const _ENV_NAME = process.env.NAME || 'development';
config = config[_ENV_NAME];

// Mongoose Connection
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUrl);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("Connected correctly to server");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// passport config
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Importing Routing files
var routes = require('./routes/index');
var user = require('./routes/user');
var questionS = require('./routes/questionS');
var polar = require('./routes/polar');

// linking callback function to route
app.use('/', routes);
app.use('/user', user);
app.use('/questionS', questionS);
app.use('/polar', polar);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found!');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
};

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Secure traffic only
app.all('*', function(req, res, next){
    console.log('req start: ',req.secure, req.hostname, req.url, app.get('port'));
  if (req.secure) {
    return next();
  };

 res.redirect('https://'+req.hostname+':'+app.get('secPort')+req.url);
});

module.exports = app;
