module.exports = app => {
    app.get('/about', function (req, res) {
        res.render('about', {
            about: aboutContent
        });
    });
}