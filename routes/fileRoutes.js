import expressAsyncHandler from 'express-async-handler';
import { upload } from '../middleware/storage.js';
import { deleteFile, uploadFile } from '../middleware/upload/uploadFiles.js';
import verifyToken from '../middleware/verifyToken.js';
import allowedTo from '../middleware/allowedTo.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

const uploadFiles = expressAsyncHandler(async (req, res, next) => {
    const files = req.files

    if (files.length !== 0) {
        for (let i = 0; i < files.length; i++) {
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

export default router;