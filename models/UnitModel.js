const mongoose = require("mongoose")
const gradeConstants = require("../tools/constants/gradeConstants")


const unitSchema = new mongoose.Schema({
    grade: { type: Number, enum: gradeConstants.map(grade => grade.index) },
    name: { type: String },
}, {
    timestamps: true,
    versionKey: false
})

const UnitModel = mongoose.model("unit", unitSchema)
module.exports = UnitModel