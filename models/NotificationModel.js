const mongoose = require("mongoose")
const UserModel = require("./UserModel")
const senderConstants = require("../tools/constants/sendersConstants")

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    subject: { type: String, required: true },
    answer: [{ type: String }],
    method: { type: String, enum: Object.values(senderConstants), default: senderConstants.CONTACT },
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    isSeen: { type: Boolean, default: false }
}, {
    timestamps: true
})

const NotificationModel = mongoose.model("notification", notificationSchema)

module.exports = NotificationModel