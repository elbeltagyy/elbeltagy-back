const expressAsyncHandler = require("express-async-handler");
const CodeModel = require("../models/CodeModel");
const { getAll, getOne, updateOne, deleteOne, insertOne, useCode } = require("./factoryHandler");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const codeConstants = require("../tools/constants/codeConstants");
const { user_roles } = require("../tools/constants/rolesConstants");

const codeParams = (query) => {
    return [
        { key: "grade", value: query.grade },
        { key: "code", value: query.code },
        { key: "type", value: query.type },
        { key: "price", value: query.price, type: 'number' },
        { key: "numbers", value: query.numbers, type: 'number' },
        { key: "isChecked", value: query.isChecked, type: "boolean" },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "usedBy", value: query.usedBy, type: 'array' },
    ]
}


const getCodes = getAll(CodeModel, 'codes', codeParams, true, 'usedBy')
const getOneCode = getOne(CodeModel)
const createCode = insertOne(CodeModel)

const updateCode = updateOne(CodeModel)
const deleteCode = deleteOne(CodeModel)

// @desc recharge code
// @route POST /codes/verify
// @access Private (user.online)
const verifyCode = expressAsyncHandler(async (req, res, next) => {
    //wallet
    const userCode = req.body.code
    const user = req.user //not admins


    if (!userCode) return next(createError('invalid data', 404, FAILED))

    const code = await CodeModel.findOne({ code: userCode })
    if (!code) return next(createError('invalid code', 404, FAILED))
    // if (code.numbers === 0 || !code.isActive) return next(createError('sorry, this code is invalid', 400, FAILED))

    //activate => error
    if (code.type === codeConstants.ACTIVATE) return next(createError('sorry, this code used only for activation', 400, FAILED))
    const message = await useCode(code, user)
    return res.status(200).json({ status: SUCCESS, message, values: user })
})

const getUserUsedCodes = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const codes = await CodeModel.find({ usedBy: { $in: [user._id] } }).lean().select('-usedBy')
    res.status(200).json({ values: codes })
})




module.exports = { getCodes, verifyCode, getUserUsedCodes, getOneCode, createCode, updateCode, deleteCode }