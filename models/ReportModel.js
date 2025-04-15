const mongoose = require("mongoose")
const CourseModel = require("./CourseModel")
const LectureModel = require("./LectureModel")


const reportSchema = new mongoose.Schema({
    startDate: Date,
    endDate: Date,
    title: String,
    description: String,
    numbers: Number,
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: LectureModel },
}, {
    timestamps: true,
    versionKey: false
})

const ReportModel = mongoose.model("report", reportSchema)
module.exports = ReportModel