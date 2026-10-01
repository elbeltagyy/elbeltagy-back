import expressAsyncHandler from 'express-async-handler';
import fs from 'fs';
import fileType from 'file-type';
import fileTypes from '../tools/constants/fileTypes.js';
import createError from '../tools/createError.js';
import { FAILED } from '../tools/statusTexts.js';

const verifyFile = (...allowedFiles) => {
    return expressAsyncHandler(async (req, res, next) => {
        const file = req.file
        const buffer = fs.readFileSync(file.path)
        const type = await fileType.fromBuffer(buffer)

        if (!type || !allowedFiles.includes([fileTypes.JPEG, fileTypes.MP4, fileTypes.PDF, fileTypes.PNG, fileTypes.WebP])) {
            return next(createError("Invalid file", 400, FAILED))
        }

        return next()
    })
}

export default verifyFile;