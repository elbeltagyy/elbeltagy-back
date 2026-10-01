import mongoose from 'mongoose';
import CourseModel from './CourseModel.js';
import LectureModel from './LectureModel.js';


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
export default ReportModel;