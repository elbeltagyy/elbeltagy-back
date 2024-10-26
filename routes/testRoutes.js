const router = require("express").Router()
const dotenv = require("dotenv")

const expressAsyncHandler = require("express-async-handler")
const { addToVimeo } = require("../middleware/upload/cloudinary")
const { upload } = require("../middleware/storage")
const UserModel = require("../models/UserModel")
const UAParser = require('ua-parser-js');
const verifyToken = require("../middleware/verifyToken");
const allowedTo = require("../middleware/allowedTo");
const { user_roles } = require("../tools/constants/rolesConstants");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");

dotenv.config()

router.use(expressAsyncHandler(async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        next()
    } else {
        next(createError('Not Found Page', 404, FAILED))
    }

}))

router.post("/", upload.single('file'), expressAsyncHandler(async (req, res, next) => {
    const file = req.file

    const video = await addToVimeo(file)

    res.json(video)
}))

router.get("/", verifyToken(true), async (req, res, next) => {
    try {
        // Get the user-agent string from the request headers
        const userAgent = req.headers['user-agent'];

        // Parse the user-agent string
        const parser = new UAParser();
        const result = parser.setUA(userAgent).getResult();

        return res.json({ device: result, userAgent })
        const users = await UserModel.find({})
        const count = await UserModel.countDocuments({})
        res.json({ msg: "done", values: { users, count } })
    } catch (error) {
        console.log('error')
        const err = new Error()
        err.message = 'Failed'
        next(err)
    }
})
module.exports = router