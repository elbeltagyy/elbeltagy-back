const mongoose = require("mongoose")
const { user_roles } = require("../tools/constants/rolesConstants")
const gradeConstants = require("../tools/constants/gradeConstants")

const governments = require("../tools/constants/governments")
const CourseModel = require("./CourseModel")
const ExamModel = require("./ExamModel")
const LectureModel = require("./LectureModel")
const GroupModel = require("./GroupModel")

const governDefault = 4

//Scoring
// marks => all answers And no repeat
// exam_marks => only exams
// total Points ==> answers and exams

const userSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index) },
    name: { type: String },
    avatar: {
        url: { type: String },
        size: { type: Number },
        resource_type: { type: String },
    },
    userName: { type: String, unique: true }, // as code | phone | userName
    email: { type: String, required: false },
    password: { type: String, required: true, select: false },
    isResetPassword: { type: Boolean },
    phone: { type: String, unique: true, required: true, },
    familyPhone: { type: String },
    isActive: { type: Boolean, default: true },
    role: {
        type: String, default: user_roles.ONLINE, required: true,
        enum: [user_roles.ADMIN, user_roles.SUBADMIN, user_roles.STUDENT, user_roles.ONLINE, user_roles.INREVIEW]
    },
    government: { type: Number, enum: governments.map(g => Number(g.id)), default: governDefault },

    devicesAllowed: { type: Number, default: 3 }, // max 2
    devicesRegistered: [{ type: String, default: [] }],
    wallet: { type: Number, default: 0, max: [2000, "اقصى مبلغ هو 2000 جنيه"] },
    fileConfirm: {
        original_filename: { type: String },
        url: { type: String },
        size: { type: Number },
        resource_type: { type: String },
        format: { type: String }
    },
    totalPoints: { type: Number, default: 0 }, // total Points ==> answers and exams and all
    exam_marks: { type: Number, default: 0 }, // exam_marks => only exams
    marks: { type: Number, default: 0 }, // marks => all answers And no repeat

    ResetCode: String,
    ResetCodeAt: Date,
    ResetCodeVerified: Boolean,

    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: CourseModel, select: false }],
    exams: [{ type: mongoose.Schema.Types.ObjectId, ref: ExamModel, select: false }], //for passing exams
    lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: LectureModel }],// for passing vids , select: false 

    accessLectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lecture' }],// for passing vids
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: GroupModel }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],
}, {
    timestamps: true,
    versionKey: false
})



const UserModel = mongoose.model("user", userSchema)
module.exports = UserModel