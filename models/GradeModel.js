import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isActive: Boolean,
    index: { type: Number, unique: true, required: true },
    image: {
        url: String,
        resource_type: String
    },
    order: Number

}, {
    timestamps: true,
    versionKey: false
})

const GradeModel = mongoose.model("grade", gradeSchema)
export default GradeModel;