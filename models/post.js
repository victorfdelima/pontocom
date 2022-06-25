const mongoose = require('mongoose');

module.exports = () => {
    const Post = mongoose.model('post', postSchema);

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
    return Post;
};