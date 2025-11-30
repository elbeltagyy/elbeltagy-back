const mongoose = require("mongoose")

const gradeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isActive: Boolean,
    index: { type: Number, unique: true, required: true },
    image: {
        url: String,
        resource_type: String
    }
}, {
    timestamps: true,
    versionKey: false
})

const GradeModel = mongoose.model("grade", gradeSchema)
module.exports = GradeModel