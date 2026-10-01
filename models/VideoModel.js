import mongoose from 'mongoose';
import filePlayers from '../tools/constants/filePlayers.js';

const videoSchema = new mongoose.Schema({
    name: { type: String },
    url: { type: String },
    player: { type: String, enum: [filePlayers.SERVER, filePlayers.YOUTUBE, filePlayers.BUNNY, filePlayers.BUNNY_UPLOAD, filePlayers.GOOGLE_DRIVE] },
    isButton: { type: Boolean, default: false },
    duration: { type: String }, //ms params
    size: { type: Number }, //bytes
    resource_type: { type: String },
    minDuration: Number,

}, {
    timestamps: true,
    versionKey: false
})

const VideoModel = mongoose.model("video", videoSchema)
export default VideoModel;