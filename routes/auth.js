const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const findOrCreate = require('mongoose-findorcreate');

module.exports = app => {
    const User = app.models.user;

    app.use(passport.initialize());
    app.use(passport.session());

    userSchema.plugin(uniqueValidator, {
        message: 'Must Be Unique.'
    });
    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    passport.use(User.createStrategy());

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
}