const expressAsyncHandler = require("express-async-handler")
const UserCourseModel = require("../models/UserCourseModel")
const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts")
const LectureModel = require("../models/LectureModel")
const { getAll } = require("./factoryHandler")
const VideoModel = require("../models/VideoModel")

const videoParams = (query) => {
    return [
        { key: "role", value: query.role },
        { key: "name", value: query.name },
        { key: "userName", value: query.userName },
        { key: "email", value: query.email },
        { key: "phone", value: query.phone },
        { key: "familyPhone", value: query.familyPhone },
        { key: "wallet", value: query.wallet, type: 'number' },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "group", value: query.group, operator: "equal" },
    ]
}

const getVideo = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const lecture = req.params.id

    const courseId = req.body.course //index

    const userCourse = await UserCourseModel.findOne({ user: user._id, course: courseId })
    if (!userCourse) return next(createError("You are not subscribed ...", 401, FAILED))

    const { video } = await LectureModel.findOne({ _id: lecture }).populate('video').select('video')
    res.status(200).json({ status: SUCCESS, values: video })
})

const getAllVideos = getAll(VideoModel, 'videos')
module.exports = { getVideo, getAllVideos }