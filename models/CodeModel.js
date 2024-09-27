const mongoose = require("mongoose")
const codeConstants = require("../tools/constants/codeConstants")
const gradeConstants = require("../tools/constants/gradeConstants")
const UserModel = require("./UserModel")


const codeSchema = new mongoose.Schema({
    grade: { type: String, enum: gradeConstants.map(g => g.index) },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: UserModel }],
    code: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: [codeConstants.ACTIVATE, codeConstants.CENTER, codeConstants.WALLET] },
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    numbers: { type: Number, default: 1 }
}, {
    timestamps: true,
    versionKey: false
})

const CodeModel = mongoose.model("code", codeSchema)
module.exports = CodeModel