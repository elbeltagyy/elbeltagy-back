import mongoose from 'mongoose';

//In my Input => any file accessible => image, record
const communityQuestion = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true, index: true },

    status: String,//'pending -  published'
    isActive: { type: Boolean, index: true, default: true },

    content: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', default: [], select: false }],
    replies: { type: Number, default: 0 },
    firstAuthorReplay: [{ type: mongoose.Schema.Types.ObjectId, ref: 'communityComment', default: [] }],

    attachments: [],
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }],
    lectures: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }]
    // reactions: Number,
}, {
    timestamps: true,
    versionKey: false
})

const CommunityQuestionModel = mongoose.model("communityQuestion", communityQuestion)
export default CommunityQuestionModel;