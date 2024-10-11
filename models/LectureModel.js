const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")
const UnitModel = require("./UnitModel")
const CourseModel = require("./CourseModel")
const VideoModel = require("./VideoModel")
const sectionConstants = require("../tools/constants/sectionConstants")
const ExamModel = require("./ExamModel")
const LinkModel = require("./LinkModel")
const FileModel = require("./FileModel")


const lectureSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel, required: true },

    name: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, required: true, default: true },

    index: { type: Number, required: true },
    isCenter: { type: Boolean, required: true, default: false },
    sectionType: { type: String, enum: [sectionConstants.VIDEO, sectionConstants.EXAM, sectionConstants.LINK, sectionConstants.FILE] },
    video: {
        type: mongoose.Schema.Types.ObjectId, ref: VideoModel
    },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel },
    altExam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel },
    link: { type: mongoose.Schema.Types.ObjectId, ref: LinkModel },
    file: { type: mongoose.Schema.Types.ObjectId, ref: FileModel },
}, {
    timestamps: true,
    versionKey: false
})

const LectureModel = mongoose.model("lecture", lectureSchema)
module.exports = LectureModel