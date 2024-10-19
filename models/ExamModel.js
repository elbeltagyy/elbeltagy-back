const mongoose = require("mongoose")

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    total: { type: Number },
    time: { type: String, default: '15m' }, //seconds
    // isActive: { type: Boolean, default: true },
    dateStart: { type: Date },
    dateEnd: { type: Date },
    showAnswersDate: { type: Date },
    
    isShowAnswers: { type: Boolean, default: true },
    attemptsNums: { type: Number, default: 1 },
    questions: [{
        title: { type: String },
        hints: { type: String },
        rtOptionId: { type: String },
        points: { type: Number, default: 1 },
        image: {
            url: { type: String },
            size: { type: Number },
            resource_type: { type: String },
        },
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