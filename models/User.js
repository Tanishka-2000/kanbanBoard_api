const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    passwordHash : String,
    boards: [{ type: Schema.Types.ObjectId, ref: 'Board' }]
})

module.exports = mongoose.model('User', userSchema)