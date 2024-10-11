const expressAsyncHandler = require("express-async-handler")
const upload = require("../middleware/storage")
const { addToCloud } = require("../middleware/cloudinary")

const router = require("express").Router()

const uploadFiles = expressAsyncHandler(async (req, res, next) => {
    const files = req.files
    console.log(files)
    if (files.length !== 0) {
        for (i = 0; i < files.length; i++) {
            const result = await addToCloud(files[i], {
                folder: "admin",
                resource_type: "auto"
            })
            console.log('uploaded done ==?', i)
            files[i] = result
        }
        console.log('uploaded done ==?', files)
    }
    res.status(201).json({ values: files })
})

router.route("/")
    .post(upload.array('files', 50), uploadFiles)

module.exports = router