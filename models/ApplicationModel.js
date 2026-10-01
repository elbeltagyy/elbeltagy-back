import mongoose from 'mongoose';
import CourseModel from './CourseModel.js';

const applicationSchema = new mongoose.Schema({
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: CourseModel }],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    grade: Number,
    title: String,
    description: String,
    isActive: Boolean,

    numbers: Number,
}, {
    timestamps: true,
    versionKey: false
})


const ApplicationModel = mongoose.model("application", applicationSchema)
export default ApplicationModel;