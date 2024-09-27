const expressAsyncHandler = require("express-async-handler");
const { getAll } = require("./factoryHandler");
const UserCourseModel = require("../models/UserCourseModel");
const CourseModel = require("../models/CourseModel");
const createError = require("../tools/createError.js");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const { makeMatch } = require("../tools/makeMatch.js");


const userCoursesParams = (query) => {
    return [
        { key: "course", value: query.course, operator: "equal" },
    ]
}



const getAllUsersCourses = getAll(UserCourseModel, 'usersCourses', userCoursesParams, 'user course')

const getUserCourses = expressAsyncHandler(async (req, res, next) => {
    const select = req.query
    const user = req.user

    const match = { user: user._id }
    makeMatch(match, userCoursesParams(req.query))

    const userCourses = await UserCourseModel.find(match).select(select).populate('course')

    res.status(200).json({ status: SUCCESS, values: userCourses })
})

const getOneUserCourse = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const course = req.params.courseId

    const match = { user: user._id, course }

    const userCourse = await UserCourseModel.findOne(match)

    res.status(200).json({ status: SUCCESS, values: userCourse })
})

const subscribe = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const courseId = req.body.course

    const isUserSubscribed = await UserCourseModel.findOne({ user: user._id, course: courseId })
    if (isUserSubscribed) {
        return next(createError('Already subscribed', 400, FAILED))
    }


    const course = await CourseModel.findById(courseId)
    if (course.price > user.wallet) {  //course.discount
        return next(createError('You dont have anough money', 400, FAILED))
    }

    user.wallet = user.wallet - course.price

    const userCourse = await UserCourseModel.create({
        user: user._id,
        course: courseId
    })

    await user.save()

    res.status(200).json({ status: SUCCESS, values: { userCourse, wallet: user.wallet }, message: 'You have subscribed to ' + course.name })
})

module.exports = { getAllUsersCourses, getOneUserCourse, subscribe, getUserCourses }