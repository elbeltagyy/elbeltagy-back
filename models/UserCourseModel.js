const mongoose = require("mongoose")
const UnitModel = require("./UnitModel")
const gradeConstants = require("../tools/constants/gradeConstants")
const UserModel = require("./UserModel")
const CourseModel = require("./CourseModel")


const userCourseSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel }
}, {
    timestamps: true,
    versionKey: false
})

const UserCourseModel = mongoose.model("userCourse", userCourseSchema)
module.exports = UserCourseModel