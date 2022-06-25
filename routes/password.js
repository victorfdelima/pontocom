const crypto = require('crypto');
const nodemailer = require('nodemailer');
module.exports = app => {

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

    app.get('/reset/:token', function (req, res) {
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
};