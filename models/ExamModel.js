const mongoose = require("mongoose")

const examSchema = new mongoose.Schema({
    total: { type: Number },
    time: { type: Number, default: (15 * 60) }, //seconds
    isActive: { type: Boolean, default: true },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    dateAnswers: { type: Date },
    isShowAnswers: { type: Boolean, default: true },
    attemptsNums: { type: Number, default: 1 },
    questions: [{
        title: { type: String },
        hints: { type: String },
        rtOptionId: { type: String },
        points: { type: Number, default: 1 },
        options: [{
            id: { type: String },
            title: { type: String },
        }],
    },]
}, {
    timestamps: true
})


const ExamModel = mongoose.model("exam", examSchema)
module.exports = ExamModel