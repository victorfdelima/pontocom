const mongoose = require('mongoose');
const Post = mongoose.model('post', postSchema);
const Date = require('date-and-time');

const postSchema = {
    username: String,
    entryDayTime: String,
    entryTimeZone: String,
    rawEntry: Number,
    exitDayTime: String,
    rawExit: Number,
    duration: String,
    complete: Boolean,
    createdAt: {
        type: Date,
        default: new Date()
    }
};

module.exports = Post;