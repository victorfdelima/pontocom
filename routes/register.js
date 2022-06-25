app.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
        res.redirect('/logged');
    } else {
        res.render('register');
    }
});