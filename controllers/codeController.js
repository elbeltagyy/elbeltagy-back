const expressAsyncHandler = require("express-async-handler");
const CodeModel = require("../models/CodeModel");
const { getAll, getOne, updateOne, deleteOne, insertOne } = require("./factoryHandler");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const codeConstants = require("../tools/constants/codeConstants");
const { user_roles } = require("../tools/constants/rolesConstants");

const codeParams = (query) => {
    return [
        { key: "grade", value: query.grade },
        { key: "code", value: query.code },
        { key: "type", value: query.type },
        { key: "price", value: query.price },
        { key: "numbers", value: query.phone },
        { key: "isActive", value: query.isActive, type: "boolean" },
    ]
}


const getCodes = getAll(CodeModel, 'codes', codeParams, 'usedBy')
const getOneCode = getOne(CodeModel)


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

    if (code.numbers === 0 || !code.isActive) return next(createError('sorry, this code is invalid', 400, FAILED))

    //activate => error
    if (code.type === codeConstants.ACTIVATE) return next(createError('sorry, this code used only for activation', 400, FAILED))

    //wallet
    if (code.type === codeConstants.WALLET) {
        const before = user.wallet
        user.wallet = user.wallet + code.price

        code.usedBy.push(user._id)
        code.numbers = code.numbers - 1

        await user.save()
        await code.save()

        return res.status(200).json({ status: SUCCESS, message: `Your wallet was ${before} and became ${user.wallet}, + ${code.price}`, values: user })
    }

    //center
    if (code.type === codeConstants.CENTER) {
        user.role = user_roles.CENTER
        user.grade = code.grade || user.grade

        code.usedBy.push(user._id)
        code.numbers = code.numbers - 1

        await user.save()
        await code.save()

        return res.status(200).json({ status: SUCCESS, message: `You bacame student in center grade => ${user.grade}`, values: user })
    }
})

const createCode = insertOne(CodeModel)

const updateCode = updateOne(CodeModel)
const deleteCode = deleteOne(CodeModel)




module.exports = { getCodes, verifyCode, getOneCode, createCode, updateCode, deleteCode }