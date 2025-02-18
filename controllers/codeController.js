const expressAsyncHandler = require("express-async-handler");
const CodeModel = require("../models/CodeModel");
const { getAll, getOne, updateOne, deleteOne, insertOne, useCode } = require("./factoryHandler");
const createError = require("../tools/createError");
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const codeConstants = require("../tools/constants/codeConstants");
const { user_roles } = require("../tools/constants/rolesConstants");
const LectureModel = require("../models/LectureModel");
const makeRandom = require("../tools/makeRandom");

const codeParams = (query) => {
    return [
        { key: "grade", value: query.grade, type: 'number' },
        { key: "code", value: query.code },
        { key: "type", value: query.type },
        { key: "price", value: query.price, type: 'number' },
        { key: "numbers", value: query.numbers, type: 'number' },
        { key: "isChecked", value: query.isChecked, type: "boolean" },
        { key: "isActive", value: query.isActive, type: "boolean" },
        { key: "usedBy", value: query.usedBy, type: 'array' },
        { key: "_id", value: query._id, operator: 'equal' },
    ]
}


const getLectureCodes = expressAsyncHandler(async (req, res, next) => {
    const lecture = req.query.lecture

    if (!lecture) return next()

    const foundLecture = await LectureModel.findById(lecture).lean().select("codes")
    if (!foundLecture) return next(createError('هذه المحاضره غير موجوده', 404, FAILED))
    if (foundLecture.codes?.length < 1 || !foundLecture.codes) return next(createError('هذه المحاضره ليس لديها اكواد ', 404, FAILED))
    req.query._id = foundLecture.codes
    req.query.type = codeConstants.LECTURES
    next()
})
const getCodes = getAll(CodeModel, 'codes', codeParams, true, 'usedBy')


const getOneCode = getOne(CodeModel)

const handelCreateCode = expressAsyncHandler(async (req, res, next) => {
    const code = req.body
    const lecture = code.lecture

    let start
    switch (code.type) {
        case codeConstants.ACTIVATE:
            start = 'act'
            break;
        case codeConstants.CENTER:
            start = 'cen'
            break;
        case codeConstants.WALLET:
            start = 'wal'
            break;
        case codeConstants.LECTURES:
            start = 'lec'
            break;
        default:
            return next(createError('Invalid Data', 400, FAILED));
    }
    const copies = code.copies || 1

    if (copies >= 1) {
        if (copies > 500) return next(createError("اقصى عدد هو 500 كود فى العمليه الواحده", 400, FAILED))

        for (let i = 0; i < copies; i++) {
            const codeName = start + `${makeRandom(0, 9, 1)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}`
            const createdCode = await CodeModel.create({ ...code, code: codeName })

            if (lecture && code.type === codeConstants.LECTURES) {
                await LectureModel.updateOne({ _id: lecture }, { $addToSet: { codes: createdCode._id } })
            }
        }

        return res.status(200).json({ message: 'تم انشاء ' + copies + ' اكواد', status: SUCCESS })
    } else {
        return next(createError('عدد النسخ لا يمكن ان يكون اقل من 1 نسخه', 400, FAILED))
    }
})
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




module.exports = { getCodes, getLectureCodes, verifyCode, getUserUsedCodes, getOneCode, handelCreateCode, createCode, updateCode, deleteCode }