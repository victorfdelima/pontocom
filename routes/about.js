const aboutContent = 'Apenas uma versão do meu app de bater ponto';

module.exports = app => {
    app.get('/about', function (req, res) {
        res.render('about', {
            about: aboutContent
        });
    });
}