import expressAsyncHandler from 'express-async-handler';
import { sendWhatsFileFc, sendWhatsMsgFc } from '../whatsappController.js';
import { createReadStream } from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegStatic); // ← ضروري على Windows

const convertToOpus = (inputPath) => {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(
            __dirname,
            '..', '..',
            'storage',
            'temp',
            `voice_${Date.now()}.ogg`
        );

        ffmpeg(inputPath)
            .audioCodec("libopus")
            .audioChannels(1)        // mono زي الواتساب
            .audioFrequency(48000)   // 48kHz مطلوب للـ opus
            .format("ogg")
            .on("end", () => resolve(outputPath))
            .on("error", reject)
            .save(outputPath);
    });
}

//On Sending
const sendMessage = expressAsyncHandler(async (req, res, next) => {
    const { phone, message } = req.body
    const file = req.file
    if (file) {
        if (file.mimetype.startsWith('audio')) {
            file.path = await convertToOpus(file.path);
            file.mimetype = "audio/ogg; codecs=opus"
        }

        const buffer = { stream: createReadStream(file.path) }
        console.log(file.mimetype)
        await sendWhatsFileFc(phone, buffer, true, file.filename, { caption: message, mimetype: file.mimetype })
    } else {
        await sendWhatsMsgFc(phone, message)
    }
    res.status(204).json({})
})
export { sendMessage };