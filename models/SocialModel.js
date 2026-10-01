import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
    id: String,
    name: String,
    access_token: String, // Page-level token (long-lived)
    category: String,
});

const socialSchema = new mongoose.Schema({
    pages: [PageSchema],
    type: String, // 'facebook'
}, {
    timestamps: true,
    versionKey: false
})

const SocialModel = mongoose.model('social', socialSchema)
export default SocialModel;