//jshint esversion:6
require('dotenv').config();
const consign = require('consign');
const express = require('express');
const session = require('express-session');
const { connections } = require('mongodb/lib/core/connection/connection');




const app = express();
app.use(express.static(__dirname + '/public'));

consign({ verbose: false })
  .include('db.js')
  .then('models')
  .then('auth.js')
  .then('routes')
  .into(app);



app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


app.use(
  session({
    secret: 'the little secret.',
    resave: false,
    saveUninitialized: false
  })
);


let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

app.listen(port, function () {
  console.log('Aguarde a mensagem "mongoDB se conectou". Após conectar clique aqui => http://localhost:3000');
});

module.exports = app;