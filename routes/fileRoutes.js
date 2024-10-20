const expressAsyncHandler = require("express-async-handler")
const upload = require("../middleware/storage")
const { deleteFile, uploadFile } = require("../middleware/upload/uploadFiles")
const makeRandom = require("../tools/makeRandom")

const router = require("express").Router()

const uploadFiles = expressAsyncHandler(async (req, res, next) => {
    const files = req.files

    if (files.length !== 0) {
        for (i = 0; i < files.length; i++) {
            const result = await uploadFile(files[i], { name: 'myFile-' + i, secure: true })
            files[i] = result
        }
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

module.exports = router