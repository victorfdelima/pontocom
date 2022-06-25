const mongoose = require('mongoose');

module.exports = (app) => {

    const User = new app.mongoose.model('user', userSchema);
    const userSchema = mongoose.Schema({
        id: {
            type: Number,
            primaryKey: true,
            autoIncrement: true
        },
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
    return User;
};