const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")

const groupSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index) },
    name: { type: Object, required: true },
    days: [{
        time: { type: String, required: true },
        dayIndex: { type: Number, required: true }
    }]

}, {
    timestamps: true,
    versionKey: false
})

const GroupModel = mongoose.model("group", groupSchema)
module.exports = GroupModel