const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")

const chapterSchema = new mongoose.Schema({
    name: String,
    description: String,
    isActive: { type: Boolean, default: true },
    grade: { type: Number, required: true },//enum: gradeConstants.map(grade => grade.index), 
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }],
    index: { type: Number, required: true }
}, {
    timestamps: true,
    versionKey: false
})

const ChapterModel = mongoose.model("chapter", chapterSchema)
module.exports = ChapterModel