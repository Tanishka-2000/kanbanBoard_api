const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const User = require('../models/User');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

//--------------------boards------------------------
router.get('/all', (req, res) => {
    
    User.findById({ _id: req.user._id }, 'boards')
    .populate({
        path: 'boards',
        select: 'name color'
    })
    .exec()
    .then( user => res.json(user.boards))
});

router.post('/new', (req, res) => {

    const { name, color } = req.body;

    const board = new Board({
            name: name,
            color: color,
            columns: [
                {
                    name: 'To-Do',
                    color: '#F8DE22',
                    limit: undefined,
                    cards:[]
                },
                {
                    name: 'In progress',
                    color: '#ffa500',
                    limit: undefined,
                    cards:[]
                },
                {
                    name: 'Done',
                    color: '#D2DE32',
                    limit: undefined,
                    cards:[]
                }
            ]
        });

    board.save()
    .then((doc) => {    
        User.updateOne(
            { _id: req.user._id},
            { $push: { boards: doc._id}}
        ).then(() => res.json('Board Created'))
    });
});

router.get('/:boardId', (req, res) => {

    Board.findById({_id: req.params.boardId})
    .then((board) => {
        res.json(board)
    });
});

router.put('/:boardId', (req, res) => {
    Board.updateOne(
        { _id: req.params.boardId},
        { $set: { name: req.body.name, color: req.body.color }}
    ).then(() => {
        res.json('Board name changed')
    })
});

router.delete('/:boardId', (req, res) => {

    Board.deleteOne({ _id: req.params.boardId})
    .then(() => {     
        User.updateOne(
            { _id: req.user._id },
            { $pull: { boards: req.params.boardId}}
        ).then(() => {
            res.json('column deleted')
        });
    });
});


// ----------------------column----------------------
router.post('/:boardId/columns', (req, res) => {

    const { name, limit, color } = req.body;
    Board.updateOne(
        { _id: req.params.boardId },
        { $push: { columns: { name, limit, color, cards:[] }}}
    ).then(() => {
        res.json('column added')
    });
});

router.put('/:boardId/column/:columnId', (req, res) => {

    const { name, limit, color } = req.body;
    Board.updateOne(
        { _id: req.params.boardId, 'columns._id': req.params.columnId },
        { $set: { 'columns.$.name': name, 'columns.$.limit': limit, 'columns.$.color': color}}
    ).then(() => {
        res.json('column updated')
    });
});

router.delete('/:boardId/column/:columnId', (req, res) => {

    Board.updateOne(
        { _id: req.params.boardId },
        { $pull: { columns: { _id: req.params.columnId}}}
    ).then(() => {
        res.json('column deleted')
    });
});


//------------------------cards-----------------------
router.post('/:boardId/column/:columnId/cards', (req, res) => {

    const card = {
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
        members: JSON.parse(req.body.members),
        subtasks: JSON.parse(req.body.subtasks),
        comments:  JSON.parse(req.body.comments),
    };
    
    Board.updateOne(
        { _id: req.params.boardId, 'columns._id': req.params.columnId},
        { $push: { 'columns.$[i].cards': card}},
        { arrayFilters: [{ 'i._id': req.params.columnId}]}
    ).then(() => {
        res.json('New card added')
    });
})

router.put('/:boardId/column/:columnId/cards/:cardId', (req, res) => {

    let { title, description, dueDate} = req.body;

    // retrieve card
    Board.aggregate([
        {$match: { _id: new ObjectId(req.params.boardId)}},
        {$unwind: '$columns'},
        {$match: { 'columns._id': new ObjectId(req.params.columnId)}},
        {$unwind: '$columns.cards'},
        {$match: {'columns.cards._id': new ObjectId(req.params.cardId)}}
    ])
    .then((data) => {
        const card = data[0].columns.cards;
        const newCard = {
            _id: card._id,
            title,
            description,
            dueDate,
            members: JSON.parse(req.body.members),
            subtasks: JSON.parse(req.body.subtasks),
            comments: JSON.parse(req.body.comments),

        }
        Board.updateOne(
            { _id: req.params.boardId},
            { $set: { 'columns.$[i].cards.$[j]': newCard }},
            { arrayFilters: [{ 'i._id': req.params.columnId }, { 'j._id': req.params.cardId }]}
        ).then( () => {
            res.json('card updated')
        })
    });
});

router.delete('/:boardId/column/:columnId/cards/:cardId', (req, res) => {

    Board.updateOne(
        { _id: req.params.boardId, 'columns._id': req.params.columnId},
        { $pull: { 'columns.$.cards': { _id: req.params.cardId}}}
    ).then(() => {
        res.json('Card deleted')
    });
});

//----------------------------------change column--------------------------
router.post('/:boardId/changeColumn', (req, res) => {

    const { currentColumnId, newColumnId, cardId } = req.body;

    // retrieve card
    Board.aggregate([
        {$match: { _id: new ObjectId(req.params.boardId)}},
        {$unwind: '$columns'},
        {$match: { 'columns._id': new ObjectId(currentColumnId)}},
        {$unwind: '$columns.cards'},
        {$match: {'columns.cards._id': new ObjectId(cardId)}}
    ])
    .then((data) => {
        const card = data[0].columns.cards;

        // pull from current column
        Board.updateOne(
        { _id: req.params.boardId, 'columns._id': currentColumnId},
        { $pull: { 'columns.$.cards': { _id: cardId}}})
        .then(() => {} );

        //push into new column
        Board.updateOne(
        { _id: req.params.boardId, 'columns._id': newColumnId},
        { $push: { 'columns.$.cards': card}})
        .then(() => {});

        res.json('column changed')
    })
});

module.exports = router;


// ----------------------------subtasks---------------------------------
// router.post('/:boardId/column/:columnId/cards/:cardId/subtasks', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $push: { 'columns.$[i].cards.$[j].subtasks': { text: req.body.text, completed: false}}},
//         { arrayFilters: [{ 'i._id': req.params.columnId }, { 'j._id': req.params.cardId }]}
//     ).then(() => {
//         res.json('subtask added!');
//     });
// });

// router.put('/:boardId/column/:columnId/cards/:cardId/subtask/:subtaskId', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $set: { 'columns.$[i].cards.$[j].subtasks.$[k].completed': req.body.isCompleted }},
//         { arrayFilters: [{ 'i._id': req.params.columnId}, {'j._id': req.params.cardId}, {'k._id': req.params.subtaskId}]}
//         )
//     .then(() => {
//         res.json('subtask updated')
//     });
// });

// router.delete('/:boardId/column/:columnId/cards/:cardId/subtask/:subtaskId', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $pull: { 'columns.$[i].cards.$[j].subtasks': { _id: req.params.subtaskId }}},
//         { arrayFilters: [{ 'i._id': req.params.columnId }, { 'j._id': req.params.cardId }]}
//         )
//     .then(() => {
//         res.json('subtask deleted')
//     });
// });


// ----------------------------comments---------------------------------
// router.post('/:boardId/column/:columnId/cards/:cardId/comments', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $push: { 'columns.$[i].cards.$[j].comments': { text: req.body.text, author: req.body.author}}},
//         { arrayFilters: [{ 'i._id': req.params.columnId }, { 'j._id': req.params.cardId }]}
//     ).then(() => {
//         res.json('comment added!');
//     });
// });

// router.put('/:boardId/column/:columnId/cards/:cardId/comment/:commentId', (req, res) => {

//     const { text, author } = req.body;
//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $set: { 
//             'columns.$[i].cards.$[j].comments.$[k].text': text,
//             'columns.$[i].cards.$[j].comments.$[k].author': author
//         }},
//         { arrayFilters: [{ 'i._id': req.params.columnId}, {'j._id': req.params.cardId}, {'k._id': req.params.commentId}]}
//         )
//     .then(() => {
//         res.json('comment updated')
//     });
// });

// router.delete('/:boardId/column/:columnId/cards/:cardId/comment/:commentId', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId },
//         { $pull: { 'columns.$[i].cards.$[j].comments': { _id: req.params.commentId }}},
//         { arrayFilters: [{ 'i._id': req.params.columnId }, { 'j._id': req.params.cardId }]}
//         )
//     .then(() => {
//         res.json('comment deleted')
//     });
// });

// --------------------remove limit from column-------------------
// router.put('/:boardId/column/:columnId/unset', (req, res) => {

//     Board.updateOne(
//         { _id: req.params.boardId, 'columns._id': req.params.columnId },
//         { $unset: { 'columns.$.limit': "" }}
//     ).then(() => {
//         res.json('column limit unset')
//     });
// });