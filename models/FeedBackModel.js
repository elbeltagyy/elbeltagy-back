import mongoose from 'mongoose';


const feedBackSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    subject: { type: String },
    description: String,
    type: { type: String, required: true },
    rating: Number
}, {
    timestamps: true,
    versionKey: false
})

const FeedBackModel = mongoose.model('feedBack', feedBackSchema)
export default FeedBackModel;
