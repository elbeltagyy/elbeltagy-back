const { createCode, getOneCode, updateCode, deleteCode, getCodes, verifyCode } = require("../controllers/codeController")
const verifyToken = require("../middleware/verifyToken")
const makeRandom = require("../tools/makeRandom")

const router = require("express").Router()



router.route("/")
    .get(getCodes)
    .post((req, res, next) => {
        req.body.code = `${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}-${makeRandom(0, 9, 4)}`
        next()
    }, createCode)

router.route('/verify')
    .post(verifyToken, verifyCode)

router.route("/:id")
    .get(getOneCode)
    .put(updateCode)
    .delete(deleteCode)

module.exports = router