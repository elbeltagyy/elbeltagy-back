const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")

const groupSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
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