const { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode, getUserUsedCodes, getLectureCodes, handelCreateCode } = require("../controllers/codeController")

const codeConstants = require("../tools/constants/codeConstants")
const makeRandom = require("../tools/makeRandom")

const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const { user_roles } = require("../tools/constants/rolesConstants")
const expressAsyncHandler = require("express-async-handler")
const CodeModel = require("../models/CodeModel")
const { SUCCESS, FAILED } = require("../tools/statusTexts")
const createError = require("../tools/createError")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getLectureCodes, getCodes)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), handelCreateCode, createCode)

router.route('/user') //for user
    .get(verifyToken(), getUserUsedCodes)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCode)

router.route("/:id")
    .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCode)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCode)

module.exports = router