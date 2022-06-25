const mongoose = require('mongoose');
const User = new mongoose.model('user', userSchema);
const Date = require('date-and-time');

const userSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: {
        type: String,
        index: true,
        unique: true,
        required: [true, 'Obrigatório']
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
});


module.exports = User;