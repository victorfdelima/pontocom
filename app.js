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
const aboutContent = 'Sistema de controle de ponto';
const contactContent = 'Email: vittinferreira@gmail.com';
const serv = require('/server');
let nameUser = '';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('view engine', ejs);
app.use(serv);
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

const uri = process.env.DB
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
  useCreateIndex: true
});
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB se conectou');
});

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

const Post = mongoose.model('post', postSchema);

app.get('/', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/logged');
  } else {
    res.render('login');
  }
});

app.get('/fail-attempt', function (req, res) {
  res.render('fail-attempt');
});

app.get('/register', function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/logged');
  } else {
    res.render('register');
  }
});

app.get('/delete', function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ username: nameUser }).exec(function (err, doc) {
      if (doc.isAdmin === true) {
        Post.deleteMany({}, function (err) {
          if (err) console.log(err);
          res.redirect('/');
        });
      } else {
        res.render('404');
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/deleteSpecific', function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ username: nameUser }).exec(function (err, doc) {
      if (doc.isAdmin === true) {
        const l = req.originalUrl;
        let from = l.substring(21, 31);
        let to = l.substring(35, l.length);

        Post.deleteMany({
          createdAt: {
            $gte: from,
            $lte: to
          }
        }).exec(function (err, doc) {
          res.redirect('/');
        });
      } else {
        res.render('404');
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/logged', function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ username: nameUser }).exec(function (err, doc) {
      if (doc.isAdmin === true) {
        Post.find().exec(function (err, doc) {
          res.render('all-entries', {
            finalDoc: doc,
            username: nameUser
          });
        });
      } else {
        Post.find({ username: nameUser }).exec(function (err, doc) {
          const finalDoc = doc;
          if (err) {
            console.log(err);
          } else if (Array.isArray(doc) && doc.length) {
            const arr = doc[doc.length - 1];
            Post.findById(arr._id, function (err, doc) {
              if (err) {
                console.log(err);
              } else if (doc.complete === true) {
                res.render('loggedFull', {
                  username: nameUser,
                  finalDoc: finalDoc
                });
              } else {
                res.render('logged', {
                  username: nameUser,
                  finalDoc: finalDoc
                });
              }
            });
          } else {
            // array is empty
            res.render('loggedFull', {
              username: nameUser,
              finalDoc: finalDoc
            });
          }
        });
      }
    });
  } else {
    res.redirect('/');
  }
});

app.get('/about', function (req, res) {
  res.render('about', {
    about: aboutContent
  });
});

app.get('/contact', function (req, res) {
  res.render('contact', {
    contact: contactContent
  });
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/logEntry/:date', function (req, res) {
  if (req.isAuthenticated()) {
    const now = req.params.date;
    const nowDayTime = now.substring(0, 25);
    const timeZone = now.substring(25, now.length);
    const rawNow = Date.now();
    const post = new Post({
      username: nameUser,
      entryDayTime: nowDayTime,
      entryTimeZone: timeZone,
      rawEntry: rawNow,
      complete: false
    });
    post.save(function (err) {
      if (err) {
        console.log(err);
      }
      res.redirect('/logged');
    });
  } else {
    res.redirect('/');
  }
});

app.get('/logExit/:date', function (req, res) {
  if (req.isAuthenticated()) {
    const now = req.params.date;
    const nowDayTime = now.substring(0, 25);
    const timeZone = now.substring(25, now.length);
    const rawNow = Date.now();

    function convertMS(milliseconds) {
      var day, hour, minute, seconds;
      seconds = Math.floor(milliseconds / 1000);
      minute = Math.floor(seconds / 60);
      seconds = seconds % 60;
      hour = Math.floor(minute / 60);
      minute = minute % 60;
      day = Math.floor(hour / 24);
      hour = hour % 24;
      function pad(n) {
        return n < 10 ? '0' + n : n;
      }

      return {
        day: pad(day),
        hour: pad(hour),
        minute: pad(minute),
        seconds: pad(seconds)
      };
    }

    Post.find({ username: nameUser }).exec(function (err, doc) {
      if (err) {
        console.log(err);
      }
      const obj = doc[doc.length - 1];
      let dur = convertMS(rawNow - obj.rawEntry);
      const timeStr = dur.hour + ':' + dur.minute + ':' + dur.seconds;

      Post.findOneAndUpdate(
        { _id: obj._id },
        {
          $set: {
            exitDayTime: nowDayTime,
            rawExit: rawNow,
            complete: true,
            duration: timeStr
          }
        },
        { new: true } // return updated post
      ).exec(function (err, post) {
        if (err) {
          console.log(err);
        }
        res.redirect('/');
      });
    });
  } else {
    res.redirect('/');
  }
});

app.get('/pass-recovery', function (req, res) {
  res.render('forgot');
});

app.post('/pass-recovery', function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            return res.render('forgotmsg', {
              message: 'Endereço de e-mail não existe'
            });
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'vittinferreira@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'vittinferreira@gmail.com',
          subject: 'Resetar da senha',
          text:
            'Você está recebendo isso porque você (ou outra pessoa) solicitou a redefinição da senha da sua conta\n\n' +
            'Clique no link a seguir ou cole no seu navegador para concluir o processo (o link expira após uma hora):\n\n' +
            'https://' +
            req.headers.host +
            '/reset/' +
            token +
            '\n\n' +
            'Se você não solicitou isso, ignore este e-mail e sua senha permanecerá inalterada.\n'
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log('mail sent');
          res.render('forgotmsg', {
            message: `Sucesso, um e-mail foi enviado para ${user.email} Com mais instruções.`
          });
          done(err, 'done');
        });
      }
    ],
    function (err) {
      if (err) return next(err);
      res.redirect('/pass-recovery');
    }
  );
});

app.get('/reset/:token', function (req, res) {
  User.findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    },
    (err, user) => {
      if (!user) {
        return res.render('forgotmsg', {
          message: 'Erro, o token de redefinição de senha é inválido ou expirou.'
        });
      }
      res.render('reset', { token: req.params.token });
    }
  );
});

app.post('/reset/:token', function (req, res) {
  async.waterfall(
    [
      function (done) {
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          function (err, user) {
            if (!user) {
              return res.render('forgotmsg', {
                message:
                  'Erro, o token de redefinição de senha é inválido ou expirou.'
              });
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                nameUser = user.username;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              return res.render('resetmsg', {
                message: 'As senhas não coincidem.',
                token: req.params.token
              });
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'victor.lima.f@hotmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'victor.lima.f@hotmail.com',
          subject: 'Sua senha foi alterada com sucesso',
          text:
            'Olá,\n\n' +
            'Esta é uma confirmação de que a senha da sua conta ' +
            user.email +
            ' acaba de ser alterado.\n'
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          // req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ],
    function (err) {
      res.redirect('/');
    }
  );
});

app.post('/register', function (req, res) {
  User.register(
    { username: req.body.username, email: req.body.email },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);

        res.render('fail-register', {
          message: err.message
        });
      } else {
        res.render('success-register');
      }
    }
  );
});

app.post('/', function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  User.find({ username: req.body.username }).exec(function (err, doc) {
    if (Array.isArray(doc) && doc.length) {
      req.login(user, function (err) {
        if (err) {
          console.log(err);
        } else {
          passport.authenticate('local', { failureRedirect: '/fail-attempt' })(
            req,
            res,
            function () {
              nameUser = req.body.username;
              res.redirect('/logged');
            }
          );
        }
      });
    } else {
      res.render('not-found');
    }
  });
});

app.all('*', (req, res) => {
  res.render('404');
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

app.listen(port, function () {
  console.log('Servidor iniciado');
});
