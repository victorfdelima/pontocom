//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const date = require('date-and-time');
const uniqueValidator = require('mongoose-unique-validator');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { connections } = require('mongodb/lib/core/connection/connection');

const rotas = require('/routes')

const aboutContent = 'Apenas uma versão do meu app de bater ponto';
const contactContent = 'Email: vittinferreira@gmail.com';

let nameUser = '';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(
  session({
    secret: 'the little secret.',
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

const uri = "mongodb+srv://pontocom:82384580@cluster0.uy612ph.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB se conectou');
});

// const uri = "mongodb+srv://pontocom:<82384580>@cluster0.uy612ph.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");

//   // perform actions on the collection object
//   client.close();

// });

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: {
    type: String,
    index: true,
    unique: true,
    required: [true, 'Is Required']
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const postSchema = {
  username: String,
  entryDayTime: String,
  entryTimeZone: String,
  rawEntry: Number,
  exitDayTime: String,
  rawExit: Number,
  duration: String,
  complete: Boolean,
  createdAt: {
    type: Date,
    default: new Date()
  }
};

userSchema.plugin(uniqueValidator, {
  message: 'Must Be Unique.'
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('user', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});



let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

app.listen(port, function () {
  console.log('Aguarde a mensagem "mongoDB se conectou". Após conectar clique aqui => http://localhost:3000');
});
