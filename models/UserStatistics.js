const mongoose = require("mongoose")
const { user_roles } = require("../tools/constants/rolesConstants")
const gradeConstants = require("../tools/constants/gradeConstants")
const GroupModel = require("./GroupModel")

const governments = require("../tools/constants/governments")


const userStatisticsSchema = new mongoose.Schema({
    user: { type: 'id' },
    course: 'id', currentIndex: '', views: 'in seconds', timesWatching: ''
}, {
    timestamps: true,
    versionKey: false
})

//current index in Lecture, videoDurations, totalScore

const UserStatisticsModel = mongoose.model("userStatistics", userStatisticsSchema)
module.exports = UserStatisticsModel