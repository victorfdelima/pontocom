module.exports = app => {
    app.get('/', async (req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/logged');
        } else {
            res.render('login');
        }
    });
    app.get('/fail-attempt', async function (req, res) {
        res.render('fail-attempt');
    });

    app.all('*', (req, res) => {
        res.render('404');
    });
}