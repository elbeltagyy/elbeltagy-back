const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")
const UnitModel = require("./UnitModel")
const CourseModel = require("./CourseModel")
const VideoModel = require("./VideoModel")


const lectureSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
    // unit: { type: mongoose.Schema.Types.ObjectId, ref: UnitModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel, required: true },

    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, required: true, default: true },

    index: { type: Number, required: true },
    isMust: { type: Boolean, required: true, default: false },
    sectionType: { type: String, enum: ['video', 'exam', 'link', 'file'] },
    video: {
        type: mongoose.Schema.Types.ObjectId, ref: VideoModel
    },
    exam: { type: String },
    altExam: { type: String },
    link: { type: String },
    file: { type: String },
}, {
    timestamps: true,
    versionKey: false
})

const LectureModel = mongoose.model("lecture", lectureSchema)
module.exports = LectureModel