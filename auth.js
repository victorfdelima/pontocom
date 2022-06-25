module.exports = app => {


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