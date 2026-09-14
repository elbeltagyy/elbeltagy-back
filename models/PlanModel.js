const mongoose = require("mongoose")

const PlanSchema = new mongoose.Schema({ //This is Section
    title: String,
    description: String,
    color: String,
    month: Number,
    isHidden: Boolean,
    isDisabled: Boolean,
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }]
}, {
    timestamps: true,
    versionKey: false
})

const PlanModel = mongoose.model("plan", PlanSchema)
module.exports = PlanModel