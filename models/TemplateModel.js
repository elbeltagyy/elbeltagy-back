const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    category: String,
    question: String,
    answer: String,
    uses: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    index: Number
}, {
    timestamps: true,
    versionKey: false
})

const TemplateModel = mongoose.model('template', templateSchema)
module.exports = TemplateModel