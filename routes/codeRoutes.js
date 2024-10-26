const { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode, getUserUsedCodes } = require("../controllers/codeController")
const allowedTo = require("../middleware/allowedTo")
const verifyToken = require("../middleware/verifyToken")
const codeConstants = require("../tools/constants/codeConstants")
const { user_roles } = require("../tools/constants/rolesConstants")
const makeRandom = require("../tools/makeRandom")

const router = require("express").Router()

router.route("/")
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getCodes)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), (req, res, next) => {
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
        req.body.code = start + `${makeRandom(0, 9, 1)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}`
        next()
    }, createCode)

router.route('/user') //for user
    .get(verifyToken(), getUserUsedCodes)

router.route('/verify')
    .post(verifyToken(), allowedTo(user_roles.STUDENT, user_roles.ONLINE), verifyCode)

router.route("/:id")
    .get(verifyToken(), getOneCode)
    .put(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), updateCode)
    .delete(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), deleteCode)

module.exports = router