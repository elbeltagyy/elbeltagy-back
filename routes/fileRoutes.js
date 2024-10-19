const expressAsyncHandler = require("express-async-handler")
const upload = require("../middleware/storage")
const { addToCloud } = require("../middleware/upload/cloudinary")
const { deleteFile } = require("../middleware/upload/uploadFiles")

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

const deleteFileFc = expressAsyncHandler(async (req, res, next) => {
    const file = req.body

    const isFoundAndDeleted = await deleteFile(file)
    res.json({ message: isFoundAndDeleted ? 'تم حذف الملف بنجاح' : 'الملف غير موجود, ارفع ملف اخر' })
})

router.route("/")
    .post(upload.array('files', 50), uploadFiles)
    .delete(deleteFileFc)

// router.route("/:fileName")
//     .delete(deleteFile)

module.exports = router