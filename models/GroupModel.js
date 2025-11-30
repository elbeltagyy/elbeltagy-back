const mongoose = require("mongoose")

const groupSchema = new mongoose.Schema({
    grade: { type: Number, required: true },
    name: { type: String, required: true },
    days: [{
        time: { type: String },
        dayIndex: { type: Number }
    }],
    index: { type: Number, required: true, unique: true },

}, {
    timestamps: true,
    versionKey: false
})

const GroupModel = mongoose.model("group", groupSchema)
module.exports = GroupModel