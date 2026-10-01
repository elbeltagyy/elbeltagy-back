import mongoose from 'mongoose';
import ReportModel from './ReportModel.js';
import UserModel from './UserModel.js';

const failedReportSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: UserModel }],
    report: { type: mongoose.Schema.Types.ObjectId, ref: ReportModel },
    reportErrors: [Object]
}, {
    timestamps: true,
    versionKey: false
})

const ReportFailedModel = mongoose.model("failedReport", failedReportSchema)
export default ReportFailedModel;