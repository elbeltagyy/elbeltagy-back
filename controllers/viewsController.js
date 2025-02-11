const expressAsyncHandler = require("express-async-handler");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");
const VideoStatisticsModel = require("../models/VideoStatisticsModel.js");
const UserModel = require("../models/UserModel.js");


const viewParams = (query) => {
    return [
        { key: "user", value: query.user, operator: "equal" },
        { key: "course", value: query.course, operator: "equal" },
        { key: "lecture", value: query.lecture, operator: "equal" },
        { key: "role", value: query.role },
        { key: "totalTime", value: query.totalTime, type: "number" },
        { key: "watchedTime", value: query.watchedTime, type: "number" },
    ]
}

const getViews = getAll(VideoStatisticsModel, 'views', viewParams)
// const updateSubscription = updateOne(UserCourseModel)

const updateView = updateOne(VideoStatisticsModel)
const removeView = deleteOne(VideoStatisticsModel)

module.exports = { getViews, updateView, removeView, }