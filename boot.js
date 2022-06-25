let port = process.env.PORT;
if (port == null || port == '') {
    port = 3000;
}

app.listen(port, function () {
    console.log('Aguarde a mensagem "mongoDB se conectou". Após conectar clique aqui => http://localhost:3000');
});