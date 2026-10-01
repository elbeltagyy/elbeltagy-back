import mongoose from 'mongoose';


const privacySchema = new mongoose.Schema({
    title: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    versionKey: false
})

const PrivacyModel = mongoose.model("privacy", privacySchema)
export default PrivacyModel;