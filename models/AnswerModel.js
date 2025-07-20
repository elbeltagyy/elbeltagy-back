const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    // attempt: { type: mongoose.Schema.Types.ObjectId, ref: 'attempt' }, //may Exam

    chosenOptionId: String,
    mark: { type: Number, required: true },
    // questionId: String,

    isCorrect: { type: Boolean, required: true },
    isHighlighted: { type: Boolean, default: false },
}, {
    timestamps: true,
    versionKey: false
})

const AnswerModel = mongoose.model("Answer", answerSchema)
module.exports = AnswerModel