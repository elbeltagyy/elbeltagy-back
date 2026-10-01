import mongoose from 'mongoose';
import UserModel from './UserModel.js';
import ExamModel from './ExamModel.js';
import CourseModel from './CourseModel.js';

const attemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel, required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: ExamModel, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    role: { type: String },
    mark: { type: Number },

    tokenTime: { type: Number }, //seconds
    preservedTime: { type: Number }, //seconds
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],

}, {
    timestamps: true,
    versionKey: false
})


const AttemptModel = mongoose.model("attempt", attemptSchema)
export default AttemptModel;