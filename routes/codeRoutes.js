const { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode, getUserUsedCodes } = require("../controllers/codeController")

const codeConstants = require("../tools/constants/codeConstants")
const makeRandom = require("../tools/makeRandom")

const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")
const expressAsyncHandler = require("express-async-handler")
const CodeModel = require("../models/CodeModel")
const { SUCCESS } = require("../tools/statusTexts")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getCodes)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), expressAsyncHandler(async (req, res, next) => {
        const code = req.body
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
            default:
                return;
        }

        if (code.copies > 1) {
            if (code.copies > 500) return next(createError("اقصى عدد هو 500 كود فى العمليه الواحده", 400, FAILED))

            for (let i = 0; i < code.copies; i++) {
                const codeName = start + `${makeRandom(0, 9, 1)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}`
                const createdCode = { ...code, code: codeName }
                await CodeModel.create(createdCode)
            }

            return res.status(200).json({ message: 'تم انشاء ' + code.copies + ' اكواد', status: SUCCESS })
        }

        req.body.code = start + `${makeRandom(0, 9, 1)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}`
        next()

    }), createCode)

router.route('/user') //for user
    .get(verifyToken(), getUserUsedCodes)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCode)

router.route("/:id")
    .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCode)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCode)

module.exports = router