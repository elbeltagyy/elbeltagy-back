const mongoose = require("mongoose")


const reportSchema = new mongoose.Schema({
    startDate: Date,
    endDate: Date,
    title: String,
    description: String,
}, {
    timestamps: true,
    versionKey: false
})

const ReportModel = mongoose.model("report", reportSchema)
module.exports = ReportModel