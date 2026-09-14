const mongoose = require("mongoose")
const UserModel = require("./UserModel")

const conversationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    phone: String,
    name: { type: String, default: 'unknown' },
    role: String,
    lastMessage: Object,
    unreadCount: { type: Number, default: 0 },
    ignored: { type: Boolean, default: false }
}, {
    timestamps: true,
    versionKey: false
})
conversationSchema.index({ phone: 1, ignored: 1 });

const ConversationModel = mongoose.model("conversation", conversationSchema)
module.exports = ConversationModel