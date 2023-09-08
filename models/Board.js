const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cardSchema = new Schema({
    title: String,
    description: String,
    members: [String],
    dueDate: Date,
    comments: [{
        id: String,
        text: String,
        author: String
    }],
    subtasks: [{
        id: String,
        text: String,
        completed: Boolean
    }]
})

const boardSchema = new Schema({
    name: String,
    color: String,
    columns: [{
        id: Schema.ObjectId,
        name: String,
        color: String,
        limit: Number,
        cards: [cardSchema]
    }],
});

module.exports = mongoose.model('Board', boardSchema);