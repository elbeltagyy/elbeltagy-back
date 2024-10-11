const { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode, getUserUsedCodes } = require("../controllers/codeController")
const verifyToken = require("../middleware/verifyToken")
const codeConstants = require("../tools/constants/codeConstants")
const makeRandom = require("../tools/makeRandom")

const router = require("express").Router()



router.route("/")
    .get(verifyToken(), getCodes)
    .post((req, res, next) => {
        const code = req.body
        let start
        switch (code.type) {
            case codeConstants.ACTIVATE:
                start = 'act'
                break;
            case codeConstants.CENTER:
                start = 'cent'
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
    .post(verifyToken(), verifyCode)

router.route("/:id")
    .get(getOneCode)
    .put(updateCode)
    .delete(deleteCode)

module.exports = router