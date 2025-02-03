const mongoose = require("mongoose")
const filePlayer = require("../tools/constants/filePlayers")


const fileSchema = new mongoose.Schema({
    name: { type: String },
    player: { type: String, enum: [filePlayer.SERVER, filePlayer.GOOGLE_DRIVE] },
    url: { type: String, required: true },
    size: { type: Number },
    resource_type: { type: String }, //image, pdf
    // format: { type: String }, //jpg, mp4
}, {
    timestamps: true,
    versionKey: false
})

const FileModel = mongoose.model("file", fileSchema)
module.exports = FileModel