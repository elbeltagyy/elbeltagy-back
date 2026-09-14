const mongoose = require("mongoose")

const planTaskSchema = new mongoose.Schema({
    title: String,
    done: Boolean,
    hidden: Boolean,
    priority: { type: String, default: 'low' },
    note: String,
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'plan', required: true }
}, {
    timestamps: true,
    versionKey: false
})

const PlanTaskModel = mongoose.model("task", planTaskSchema)
module.exports = PlanTaskModel