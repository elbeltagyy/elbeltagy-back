const mongoose = require("mongoose")


const unitSchema = new mongoose.Schema({
    grade: { type: Number, },
    name: { type: String },
}, {
    timestamps: true,
    versionKey: false
})

const UnitModel = mongoose.model("unit", unitSchema)
module.exports = UnitModel