const mongoose = require("mongoose")
const UserModel = require("./UserModel")
const ExamModel = require("./ExamModel")
const CourseModel = require("./CourseModel")

const attemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel, required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    role: { type: String },
    mark: { type: Number },

    tokenTime: { type: Number }, //seconds
    preservedTime: { type: Number }, //seconds
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],


    // Not Used
    // chosenOptions: [{ //Ref to Answer Model.
    //     questionId: { type: String }, //Ref To Question Model
    //     question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
    //     chosenOptionId: { type: String },
    // },],
}, {
    timestamps: true,
    versionKey: false
})


const AttemptModel = mongoose.model("attempt", attemptSchema)
module.exports = AttemptModel