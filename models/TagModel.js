const { default: mongoose } = require("mongoose");
const gradeConstants = require("../tools/constants/gradeConstants");

const tagSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
    description: String
}, {
    timestamps: true,
    versionKey: false
})

const TagModel = mongoose.model('tag', tagSchema)
module.exports = TagModel
