const mongoose = require('mongoose');
const filePlayers = require('../tools/constants/filePlayers');
const gradeConstants = require('../tools/constants/gradeConstants');

const questionSchema = new mongoose.Schema({
    // questionId: String,
    //For Idea should Ref To => grade ;or; Tags
    prevId: String,
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],

    title: String,
    hints: String,
    points: { type: Number, default: 1 },

    options: [{ id: String, title: String }],
    rtOptionId: { type: String },

    isActive: { type: Boolean, default: true },
    clarifyText: String,
    clarifyUrl: String,
    // explanation: String,

    image: {
        url: String,
        // size: { type: Number },
        resource_type: String,
        player: { type: String, enum: [filePlayers.SERVER] }
    },
}, {
    timestamps: true,
    versionKey: false

});

const QuestionModel = mongoose.model('Question', questionSchema);
module.exports = QuestionModel