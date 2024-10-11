const mongoose = require("mongoose")
const LectureModel = require("./LectureModel")
const videoPlayers = require("../tools/constants/videoPlayers")

const videoSchema = new mongoose.Schema({
    // original_filename: { type: String },
    name: { type: String },
    url: { type: String },
    player: { type: String, enum: [videoPlayers.SERVER, videoPlayers.YOUTUBE, videoPlayers.BUNNY, videoPlayers.BUNNY_UPLOAD] },
    isButton: { type: Boolean, default: false },
    duration: { type: String }, //ms params
    size: { type: Number }, //bytes
    resource_type: { type: String },
    // format: { type: String },
    // lecture: { type: mongoose.Schema.Types.ObjectId, ref: LectureModel, required: true },

}, {
    timestamps: true,
    versionKey: false
})

const VideoModel = mongoose.model("video", videoSchema)
module.exports = VideoModel