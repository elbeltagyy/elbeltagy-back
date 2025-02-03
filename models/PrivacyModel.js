const mongoose = require("mongoose")


const privacySchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    versionKey: false
})

const PrivacyModel = mongoose.model("privacy", privacySchema)
module.exports = PrivacyModel