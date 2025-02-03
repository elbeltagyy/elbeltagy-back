const expressAsyncHandler = require("express-async-handler");
const fs = require('fs')
const fileType = require('file-type');
const fileTypes = require("../tools/constants/fileTypes");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");

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

module.exports = verifyFile