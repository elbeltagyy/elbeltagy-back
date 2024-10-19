const mongoose = require("mongoose")
const LectureModel = require("./LectureModel")
const filePlayers = require("../tools/constants/filePlayers")

const videoSchema = new mongoose.Schema({
    // original_filename: { type: String },
    name: { type: String },
    url: { type: String },
    player: { type: String, enum: [filePlayers.SERVER, filePlayers.YOUTUBE, filePlayers.BUNNY, filePlayers.BUNNY_UPLOAD] },
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