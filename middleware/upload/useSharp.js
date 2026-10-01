import expressAsyncHandler from 'express-async-handler';
import sharp from 'sharp';

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
export { imgSharp };

// const compessImg = expressAsyncHandler(async(req, res))