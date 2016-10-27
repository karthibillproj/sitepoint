/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');


mongoose.connect('mongodb://localhost/MyDatabase');
var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session()); 
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var Schema = mongoose.Schema;


var UserDetail = new Schema({
	firstname: String,
    lastname: String,
    username: String,
    password: String
}, {collection: 'userInfo'});

var UserDetails = mongoose.model('userInfo',UserDetail);

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


passport.use(new LocalStrategy(
  function(username, password, done) {
   
    process.nextTick(function () {
	  UserDetails.findOne({'username':username},
		function(err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (user.password != password) { return done(null, false); }
			return done(null, user);
		});
    });
  }
));


passport.use('signup', new LocalStrategy({
    passReqToCallback : true
  },
  function(req, username, password, done) {
    findOrCreateUser = function(){
      // find a user in Mongo with provided username
      UserDetails.findOne({'username':username},function(err, user) {
        // In case of any error return
        if (err){
          console.log('Error in SignUp: '+err);
          return done(err);
        }
        // already exists
        if (user) {
          console.log('User already exists');
          return done(null, false, 
             req.flash('message','User Already Exists'));
        } else {
          // if there is no user with that email
          // create the user
          var newUser = new UserDetails();
          // set the user's local credentials
          newUser.username = username;
          newUser.password = req.param('password');
        //  newUser.email = req.param('email');
          newUser.firstname = req.param('firstname');
          newUser.lastname = req.param('lastname');
 
          // save the user
          newUser.save(function(err) {
            if (err){
              console.log('Error in Saving user: '+err);  
              throw err;  
            }
            console.log('User Registration succesful');    
            return done(null, newUser);
          });
        }
      });
    };
     
    process.nextTick(findOrCreateUser);
  })
 );



app.get('/auth', function(req, res, next) {
  res.sendfile('views/login.html');
});

app.get('/', function(req, res) {
	if(!req.isAuthenticated()){
		res.sendfile('views/indexsignup.html');
	}else{
		 res.redirect('/loginSuccess');
	}
});


app.get('/loginFailure' , function(req, res, next){
	res.send('Failure to authenticate');
});

app.get('/loginSuccess' , function(req, res, next){
	res.send('Successfully authenticated');
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/loginSuccess',
    failureRedirect: '/loginFailure'
  }));
  
  app.post('/signup', passport.authenticate('signup', {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash : true 
  }));
  
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/auth');
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

