const mongoose = require("mongoose")
const filePlayers = require("../tools/constants/filePlayers")
const { examMethods, getExamMethod } = require("../tools/constants/examMethod")

const defaultMethod = getExamMethod({ isDefault: true })?.value


const examSchema = new mongoose.Schema({
    name: { type: String, required: true },
    method: { type: String, enum: examMethods.map(exam => exam.value), default: defaultMethod },

    time: { type: String, default: '15m' }, //seconds
    isTime: { type: Boolean, default: true },
    showAnswersDate: { type: Date },

    isShowAnswers: { type: Boolean, default: true },
    attemptsNums: { type: Number, default: 1, min: [0, 'القيمة الدنيا هي 0'], },

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    prevQuestions: [{ //Ref To Question
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
    }],

    // questions: [{ //Ref To Question
    //     title: { type: String },
    //     hints: { type: String },
    //     rtOptionId: { type: String },
    //     points: { type: Number, default: 1 },
    //     image: {
    //         url: { type: String },
    //         // size: { type: Number },
    //         resource_type: { type: String },
    //         player: { type: String, enum: [filePlayers.SERVER] }
    //     },
    //     options: [{
    //         id: { type: String },
    //         title: { type: String },
    //     }],
    // },]
}, {
    timestamps: true
})


const ExamModel = mongoose.model("exam", examSchema)
module.exports = ExamModel