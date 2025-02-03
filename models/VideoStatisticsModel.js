const mongoose = require("mongoose")
const filePlayers = require("../tools/constants/filePlayers")
const UserModel = require("./UserModel")
const CourseModel = require("./CourseModel")
const LectureModel = require("./LectureModel")
const VideoModel = require("./VideoModel")

const videoStatisticsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: LectureModel },
    video: { type: mongoose.Schema.Types.ObjectId, ref: VideoModel },
    statisticsId: { type: String, unique: true },

    role: { type: String },

    totalTime: Number,
    watchedTime: Number,

    mainEvents: [Object],
    // events: [Object],
}, {
    timestamps: true
})

const mainEvent = {
    date: '',
    name: '',
    speed: '',
    watched: '',
    startTime: '',
    endTime: '',
}
const VideoStatisticsModel = mongoose.model("VideoStatistics", videoStatisticsSchema)
module.exports = VideoStatisticsModel