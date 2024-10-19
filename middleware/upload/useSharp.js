const expressAsyncHandler = require("express-async-handler");
const sharp = require("sharp")

const imgSharp = (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const webpBuffer = await sharp(file.path)
                .toFormat('webp')
                .toBuffer();

            return resolve(webpBuffer)
        } catch (error) {
            reject(error)
        }
    })
}
module.exports = { imgSharp }

// const compessImg = expressAsyncHandler(async(req, res))