const expressAsyncHandler = require("express-async-handler")
const UserCourseModel = require("../models/UserCourseModel")
const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts")
const LectureModel = require("../models/LectureModel")
const { getAll } = require("./factoryHandler")
const VideoModel = require("../models/VideoModel")
const VideoStatisticsModel = require("../models/VideoStatisticsModel")
const ms = require("ms")
const UserModel = require("../models/UserModel")

const handelEvents = (allEvents = [], newEvent = null, watchedTime, currentTime, secondsInStock) => {
    // New Event => watchedTime, endTime
    // Handel Events
    let lastEvent = allEvents[allEvents.length - 1]
    // console.log({ allEvents, newEvent, watchedTime, currentTime, secondsInStock, lastEvent })

    if (newEvent?.name === 'Es' && newEvent?.speed === lastEvent?.speed) {
        newEvent = null
    }

    if (lastEvent && newEvent) {
        lastEvent.watchedTime += secondsInStock
        lastEvent.endTime = currentTime

        newEvent = { ...newEvent, watchedTime, endTime: currentTime }

        allEvents[allEvents.length - 1] = lastEvent
        return [...allEvents, newEvent]
    } else if (lastEvent) {
        lastEvent.watchedTime += (watchedTime + secondsInStock)
        lastEvent.endTime = currentTime

        allEvents[allEvents.length - 1] = lastEvent
        return allEvents

    } else if (newEvent) {
        newEvent = { ...newEvent, watchedTime, endTime: currentTime }
        return [...allEvents, newEvent]
    }
}

const getAllVideos = getAll(VideoModel, 'videos')

// @POST Request
// @ POST REQ => /video_statistics/on
const countStatistics = expressAsyncHandler(async (req, res, next) => {
    let { totalTime, watchedTime, secondsInStock = 0, currentTime, speed, events, newMainEvent = null,
        video, course, statisticsId, lecture
    } = req.body

    const user = req.user
    //find Statistics

    const videoStatistics = await VideoStatisticsModel.findOne({
        user: user._id, statisticsId, lecture
    })

    if (!videoStatistics) {
        const mainEvents = handelEvents([], newMainEvent, watchedTime, currentTime)



        await Promise.all([
            UserModel.findByIdAndUpdate(
                user._id,
                { $addToSet: { lectures: lecture } }, // $addToSet prevents duplicates
                { new: true } // returns the updated user
            ),
            VideoStatisticsModel.create({
                statisticsId, user: user._id, role: user.role, course, lecture, video,
                totalTime, watchedTime: (watchedTime + secondsInStock), mainEvents
            })
        ])

        return res.status(204).json()
    }

    // Handel Time And View Time
    videoStatistics.totalTime += totalTime
    videoStatistics.watchedTime += (watchedTime + secondsInStock)
    // Handel Events
    videoStatistics.mainEvents = handelEvents(videoStatistics.mainEvents, newMainEvent, watchedTime, currentTime, secondsInStock)
    await videoStatistics.save()

    // ######## working in object #########
    return res.status(204).json()
})

module.exports = { getAllVideos, countStatistics }