import mongoose from 'mongoose';


const commentSchema = new mongoose.Schema({
    question: { type: mongoose.Schema.Types.ObjectId, ref: "communityQuestion", required: true, index: true, },
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: "user", required: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId, ref: "CommunityComment", default: null,
    },

    content: {
        type: String, maxlength: 10000,
    },
    attachments: [],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', default: [], select: false }],
    replies: { type: Number, default: 0 },

    isActive: { type: Boolean, index: true, default: true },
    status: {
        type: String,
        default: "published",
    },

}, {
    timestamps: true,
    versionKey: false
})

const CommunityCommentModel = mongoose.model("communityComment", commentSchema)
export default CommunityCommentModel;