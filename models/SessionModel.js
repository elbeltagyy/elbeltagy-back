import mongoose from 'mongoose';
import UserModel from './UserModel.js';

//react device detect
const sessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel, required: true },
    expiresAt: { type: Date, required: true },
    logout: { type: Date },
    isLoggedOutAutomatic: Boolean,

    ip: String,
    refreshToken: { type: String },
    deviceId: { type: String },

    browserName: { type: String },
    browserVersion: { type: String },
    deviceType: { type: String },
    deviceName: { type: String },
}, {
    timestamps: true,
    versionKey: false
})

const SessionModel = mongoose.model("session", sessionSchema)
export default SessionModel;

// device