//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
var session = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate')
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  User.findById(id).then(user=>{
            done(null, user);
        })
        .catch((err)=>{ return done(err); });
});
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  async function (accessToken, refreshToken, profile, done) {
    try {
      console.log(profile);
      // Find or create user in your database
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        // Create new user in database
        const username = Array.isArray(profile.emails) && profile.emails.length > 0 ? profile.emails[0].value.split('@')[0] : '';
        const newUser = new User({
          username: profile.displayName,
          googleId: profile.id
        });
        user = await newUser.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));
app.get("/", function(req, res){
  res.render("home");
})
app.get("/login", function(req, res){
  res.render("login");
})
app.get("/register", function(req, res){
  res.render("register");
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/secrets", function(req, res){
  if (req.isAuthenticated()){
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
app.post("/register", async function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});
app.post("/login", async function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
       res.redirect("/secrets");
     });
   }
});
});






app.listen(3000, function() {
  console.log("Server started on port 3000.");
})
