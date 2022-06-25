

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