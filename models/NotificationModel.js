import mongoose from 'mongoose';
import UserModel from './UserModel.js';
import { senderConstants } from '../tools/constants/sendersConstants.js';

const notificationSchema = new mongoose.Schema({
    message: { type: String },
    subject: { type: String },
    method: { type: String, enum: Object.values(senderConstants), default: senderConstants.CONTACT },
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    isSeen: { type: Boolean, default: false },

    // answer: [{ type: String }], *_*
    phone: String,
    direction: { type: String }, //inbound - outbound is me AI
    messageId: String,
    type: String, //image - video - text - ...etc
    media: {
        url: String,
        resource_type: String, //mime
    },
    reactions: [{
        phone: String,
        fromMe: Boolean,
        emoji: String
    }],
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
}, {
    timestamps: true
})
notificationSchema.index({ messageId: 1 });
const NotificationModel = mongoose.model("notification", notificationSchema)

export default NotificationModel;