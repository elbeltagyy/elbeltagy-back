const expressAsyncHandler = require("express-async-handler");
const { getAll, getOne, insertOne, deleteOne, updateOne } = require("./factoryHandler");
const UserCourseModel = require("../models/UserCourseModel");
const CourseModel = require("../models/CourseModel");
const createError = require("../tools/createError.js");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const UserModel = require("../models/UserModel.js");


const userCoursesParams = (query) => {
    return [
        { key: "course", value: query.course, operator: "equal" },
        { key: "user", value: query.user, operator: "equal" },
        { key: "currentIndex", value: query.currentIndex, type: "number" },
        { key: "payment", value: query.payment, type: "number" },
    ]
}

// const getUsersCourses = getAll(UserCourseModel, 'subscriptions', userCoursesParams)
const getCourseSubscriptions = getAll(UserCourseModel, 'subscriptions', userCoursesParams)
const updateSubscription = updateOne(UserCourseModel)

const removeSubscription = expressAsyncHandler(async (req, res, next) => {
    const subscriptionId = req.params.id

    const userCourse = await UserCourseModel.findById(subscriptionId)
    // console.log(userCourse)
    await Promise.all([
        UserModel.findByIdAndUpdate(
            userCourse.user,
            { $pull: { courses: userCourse.course } },
        ),
        userCourse.deleteOne()
    ])

    res.json({ message: 'تم ازاله الاشتراك', status: SUCCESS })
})

const addSubscription = expressAsyncHandler(async (req, res, next) => {
    const userId = req.body.user
    const courseId = req.body.course

    const userCourse = await UserCourseModel.findOne({ user: userId, course: courseId })
    if (userCourse) {
        return next(createError("هذا الطالب مشترك بالفعل", 400, FAILED))
    }

    const [doc] = await Promise.all([
        await UserCourseModel.create(req.body),
        await UserModel.updateOne({ _id: userId }, {
            $push: { courses: courseId },
        })
    ]).catch(err => {
        return next(err)
    })

    return res.status(201).json({ status: SUCCESS, values: doc, message: 'تم الانشاء بنجاح' })
})
// insertOne(UserCourseModel)
//add to courses in user
module.exports = { getCourseSubscriptions, userCoursesParams, updateSubscription, addSubscription, removeSubscription }