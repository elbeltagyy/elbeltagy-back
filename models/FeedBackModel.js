const { default: mongoose } = require("mongoose");

 
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
module.exports = FeedBackModel
