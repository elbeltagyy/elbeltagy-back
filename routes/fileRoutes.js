const expressAsyncHandler = require("express-async-handler")
const { upload } = require("../middleware/storage")
const { deleteFile, uploadFile } = require("../middleware/upload/uploadFiles")
const verifyToken = require("../middleware/verifyToken")
const allowedTo = require("../middleware/allowedTo")
const { user_roles } = require("../tools/constants/rolesConstants")

const router = require("express").Router()

const uploadFiles = expressAsyncHandler(async (req, res, next) => {
    const files = req.files

    if (files.length !== 0) {
        for (i = 0; i < files.length; i++) {
            const result = await uploadFile(files[i], { name: 'myFile-' + i, secure: true }, { parent: null, key: null })
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
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.array('files', 50), uploadFiles)
    .delete(verifyToken(), deleteFileFc)

module.exports = router