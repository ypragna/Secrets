//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var encrypt = require("mongoose-encryption");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect('mongodb://127.0.0.1:27017/userDB');
const userSchema = new mongoose.Schema({
  email: String,
  password: String
})
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
const User = mongoose.model("User", userSchema);
app.get("/", function(req, res){
  res.render("home");
})
app.get("/login", function(req, res){
  res.render("login");
})
app.get("/register", function(req, res){
  res.render("register");
})
app.post("/register", async function(req, res){
  try{
    const username = req.body.username;
    const password = req.body.password;
    bcrypt.hash(password, saltRounds, function(err, hash) {
      const user = new User({
        email: username,
        password: hash
      })
      user.save();
      res.render("secrets");
});


  }catch(err){
    res.send(err);
  }
})
app.post("/login", async function(req, res){
  try{
    const username = req.body.username;
    const password = req.body.password;
    const founduser = await User.findOne({email: username});
    if(founduser){
      bcrypt.compare(password, founduser.password, function(err, result) {
    if(result === true){
      res.render("secrets");
    }
});
    }else{
      console.log("username or password is incorrect");
    }

  }catch(err){
    res.send(err);
  }
})






app.listen(3000, function() {
  console.log("Server started on port 3000.");
})
