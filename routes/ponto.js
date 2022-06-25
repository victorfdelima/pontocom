const date = require('date-and-time');

module.exports = app => {
    const Post = app.models.post;

    app.get('/logExit/:date', async function (req, res) {
        try {
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
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.get('/logEntry/:date', async function (req, res) {
        try {
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
                    res.status(200).json({ msg: 'Ponto batido com sucesso' })
                });
            } else {
                res.redirect('/');
            }
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.get('/delete', async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                User.findOne({ username: nameUser }).exec(function (err, doc) {
                    if (doc.isAdmin === true) {
                        Post.deleteMany({}, function (err) {
                            if (err) console.log(err);
                            res.redirect('/');
                        });
                        res.status(200).json({ msg: 'Ponto Excluido com sucesso' });
                    } else {
                        res.render('404');
                    }
                });
            } else {
                res.redirect('/');
            }
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });

    app.get('/deleteSpecific', async function (req, res) {
        try {
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
                        res.status(200).json({ msg: 'Ponto específico excluido' });
                    } else {
                        res.render('404');
                    }
                });
            } else {
                res.redirect('/');
            }
        } catch (err) {
            res.status(412).json({ msg: err.message });
        }
    });
}