const mongoose = require("mongoose")
const UserModel = require("./UserModel")
const ExamModel = require("./ExamModel")
const CourseModel = require("./CourseModel")

const attemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    role: { type: String },
    mark: { type: Number },
    tokenTime: { type: Number }, //seconds
    chosenOptions: [{
        questionId: { type: String },
        chosenOptionId: { type: String },
    },]
}, {
    timestamps: true
})


const AttemptModel = mongoose.model("attempt", attemptSchema)
module.exports = AttemptModel