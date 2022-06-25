const contactContent = 'Email: vittinferreira@gmail.com';

module.exports = app => {

    app.get('/contact', function (req, res) {
        res.render('contact', {
            contact: contactContent
        });
    });
}