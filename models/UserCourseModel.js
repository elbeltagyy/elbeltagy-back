import mongoose from 'mongoose';
import UserModel from './UserModel.js';
import CourseModel from './CourseModel.js';


const userCourseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    currentIndex: { type: Number, default: 1, min: [0, 'القيمة الدنيا هي 0'], },
    payment: { type: Number, default: 0, min: [0, 'القيمة الدنيا هي 0'], }
}, {
    timestamps: true,
    versionKey: false
})

const UserCourseModel = mongoose.model("userCourse", userCourseSchema)
export default UserCourseModel;