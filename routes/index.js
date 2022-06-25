const { all } = require("async");



app.get('/', async function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/logged');
    } else {
        res.render('login');
    }
});

app.get('/fail-attempt', async function (req, res) {
    res.render('fail-attempt');
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



app.all('*', (req, res) => {
    res.render('404');
});

module.exports = all;