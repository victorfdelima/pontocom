module.exports = app => {
    const User = app.models.user;
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
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
}