const mongoose = require("mongoose")
const filePlayers = require("../tools/constants/filePlayers")

const videoSchema = new mongoose.Schema({
    name: { type: String },
    url: { type: String },
    player: { type: String, enum: [filePlayers.SERVER, filePlayers.YOUTUBE, filePlayers.BUNNY, filePlayers.BUNNY_UPLOAD] },
    isButton: { type: Boolean, default: false },
    duration: { type: String }, //ms params
    size: { type: Number }, //bytes
    resource_type: { type: String },
}, {
    timestamps: true,
    versionKey: false
})

const VideoModel = mongoose.model("video", videoSchema)
module.exports = VideoModel