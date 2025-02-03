const mongoose = require("mongoose")

const linkSchema = new mongoose.Schema({
    url: { type: String },
    isVideo: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false
})

const LinkModel = mongoose.model("link", linkSchema)
module.exports = LinkModel