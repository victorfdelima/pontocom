const User = require("../models/user");

module.exports = app => {
    const User = app.models.user;

    let nameUser = '';

    app.get('/logout', async function (req, res) {
        try {
            req.logout();
            res.redirect('/');
            res.status(200).json({ msg: 'Deslogado com Sucesso' });
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.get('/logged', async function (req, res) {
        try {
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
                req.status(200).json({ msg: 'Usuário logado com sucesso' });
            } else {
                res.redirect('/');
            }
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });
    app.get('/register', async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                res.redirect('/logged');
                res.status(200).json({ msg: 'Conta Criada com sucesso, usuário logado' })
            } else {
                res.render('register');
            }
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.post('/register', async function (req, res) {
        try {
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
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });
    app.get('/fail-attempt', async function (req, res) {
        try {
            res.render('fail-attempt');
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.post('/', async function (req, res) {
        try {
            const user = new user({
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
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    })
}