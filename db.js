const mongoose = require('mongoose');


const uri = "mongodb+srv://pontocom:82384580@cluster0.uy612ph.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB se conectou');
});

