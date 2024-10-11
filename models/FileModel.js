const mongoose = require("mongoose")
const filePlayer = require("../tools/constants/filePlayer")


const fileSchema = new mongoose.Schema({
    name: { type: String },
    player: { type: String, enum: [filePlayer.SERVER, filePlayer.URL] },
    url: { type: String },
    size: { type: Number },
    resource_type: { type: String }, //image, pdf
    // format: { type: String }, //jpg, mp4
}, {
    timestamps: true,
    versionKey: false
})

const FileModel = mongoose.model("file", fileSchema)
module.exports = FileModel