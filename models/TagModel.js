const { default: mongoose } = require("mongoose");
const gradeConstants = require("../tools/constants/gradeConstants");

//Tag payments => UserQuestionBank, getTags in controller, price in model
const tagSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index), required: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
    description: String,
    price: Number,
    isFree: Boolean
}, {
    timestamps: true,
    versionKey: false
})

const TagModel = mongoose.model('tag', tagSchema)
module.exports = TagModel
