import mongoose from 'mongoose';
import filePlayers from '../tools/constants/filePlayers.js';
import UserModel from './UserModel.js';
import CourseModel from './CourseModel.js';
import LectureModel from './LectureModel.js';
import VideoModel from './VideoModel.js';

const videoStatisticsSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    course: { type: mongoose.Schema.Types.ObjectId, ref: CourseModel },
    lecture: { type: mongoose.Schema.Types.ObjectId, ref: LectureModel },
    video: { type: mongoose.Schema.Types.ObjectId, ref: VideoModel },
    statisticsId: { type: String, unique: true },

    role: { type: String },

    totalTime: Number,
    watchedTime: Number, //Seconds

    mainEvents: [Object],
    // events: [Object],
}, {
    timestamps: true
})
videoStatisticsSchema.index({ user: 1, lecture: 1 });

const mainEvent = {
    date: '',
    name: '',
    speed: '',
    watched: '',
    startTime: '',
    endTime: '',
}
const VideoStatisticsModel = mongoose.model("VideoStatistics", videoStatisticsSchema)
export default VideoStatisticsModel;