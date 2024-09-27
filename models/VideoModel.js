const mongoose = require("mongoose")
const LectureModel = require("./LectureModel")
const videoPlayers = require("../tools/constants/videoPlayers")

const videoSchema = new mongoose.Schema({
    original_filename: { type: String },
    url: { type: String },
    size: { type: Number },
    resource_type: { type: String },
    format: { type: String },
    player: { type: String, enum: [videoPlayers.SERVER, videoPlayers.YOUTUBE] },
    duration: { type: Number }, //seconds
    // lecture: { type: mongoose.Schema.Types.ObjectId, ref: LectureModel, required: true },

}, {
    timestamps: true,
    versionKey: false
})

const VideoModel = mongoose.model("video", videoSchema)
module.exports = VideoModel