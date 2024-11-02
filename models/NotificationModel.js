const mongoose = require("mongoose")
const UserModel = require("./UserModel")

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    subject: { type: String, required: true },
    answer: [{ type: String }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    isSeen: { type: Boolean, default: false }
}, {
    timestamps: true
})

const NotificationModel = mongoose.model("notification", notificationSchema)

module.exports = NotificationModel