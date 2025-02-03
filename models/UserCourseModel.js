const mongoose = require("mongoose")
const UnitModel = require("./UnitModel")
const gradeConstants = require("../tools/constants/gradeConstants")
const UserModel = require("./UserModel")
const CourseModel = require("./CourseModel")


const userCourseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    currentIndex: { type: Number, default: 1 },
    payment: { type: Number, default: 0 }
    // views: { type: Number }, timesWatching: { type: Number }
}, {
    timestamps: true,
    versionKey: false
})

const UserCourseModel = mongoose.model("userCourse", userCourseSchema)
module.exports = UserCourseModel