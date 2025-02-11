const mongoose = require("mongoose")
const ReportModel = require("./ReportModel")
const UserModel = require("./UserModel")

const failedReportSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: UserModel }],
    report: { type: mongoose.Schema.Types.ObjectId, ref: ReportModel },
    reportErrors: [Object]
}, {
    timestamps: true,
    versionKey: false
})

const ReportFailedModel = mongoose.model("failedReport", failedReportSchema)
module.exports = ReportFailedModel