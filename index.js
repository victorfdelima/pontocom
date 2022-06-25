//jshint esversion:6
require('dotenv').config();
const consign = require('consign');
const express = require('express');
const session = require('express-session');



const app = express();
app.set('view engine', 'ejs');
app.use(
  session({
    secret: 'the little secret.',
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

consign({ verbose: false })
  .include('db.js')
  .then('models')
  .then('auth.js')
  .then('routes')
  .then('boot.js')
  .into(app);

module.exports = app;