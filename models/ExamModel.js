const mongoose = require("mongoose")
const filePlayers = require("../tools/constants/filePlayers")

const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    total: { type: Number },
    time: { type: String, default: '15m' }, //seconds
    showAnswersDate: { type: Date },

    isShowAnswers: { type: Boolean, default: true },
    attemptsNums: { type: Number, default: 1, min: [0, 'القيمة الدنيا هي 0'], },
    questions: [{
        title: { type: String },
        hints: { type: String },
        rtOptionId: { type: String },
        points: { type: Number, default: 1 },
        image: {
            url: { type: String },
            // size: { type: Number },
            resource_type: { type: String },
            player: { type: String, enum: [filePlayers.SERVER] }
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