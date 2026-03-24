const mongoose = require("mongoose")
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
}, {
    timestamps: true
})


const ExamModel = mongoose.model("exam", examSchema)
module.exports = ExamModel