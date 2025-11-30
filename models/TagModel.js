const { default: mongoose } = require("mongoose");

//Tag payments => UserQuestionBank, getTags in controller, price in model
const tagSchema = new mongoose.Schema({
    grade: { type: Number, required: true },
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
