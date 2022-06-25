const User = require("../models/user");
const async = require('async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
module.exports = app => {

    const User = app.models.user;

    let nameUser = '';


    app.get('/pass-recovery', async function (req, res) {
        try {
            res.render('forgot');
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
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
                                message: 'Email Address Doesnot Exist'
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
                        from: 'pontocom@pontocom.com.br',
                        subject: 'Node.js Password Reset',
                        text:
                            'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process (Link will expire after one hour):\n\n' +
                            'https://' +
                            req.headers.host +
                            '/reset/' +
                            token +
                            '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        console.log('mail sent');
                        res.render('forgotmsg', {
                            message: `Success, An E-Mail Has Been Sent To ${user.email} With Further Instructions.`
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

    app.get('/reset/:token', async function (req, res) {
        try {
            User.findOne(
                {
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: { $gt: Date.now() }
                },
                (err, user) => {
                    if (!user) {
                        return res.render('forgotmsg', {
                            message: 'Error, Password reset token is invalid or has expired.'
                        });
                    }
                    res.render('reset', { token: req.params.token });
                }
            );
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
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
                                        'Error, Password reset token is invalid or has expired.'
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
                                    message: 'Passwords Do Not Match.',
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
                            user: 'ted.mcgrath.woodworks@gmail.com',
                            pass: process.env.GMAILPW
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'pass-reset@payrolltracker.com',
                        subject: 'Your password has been changed',
                        text:
                            'Hello,\n\n' +
                            'This is a confirmation that the password for your account ' +
                            user.email +
                            ' has just been changed.\n'
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