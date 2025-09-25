const expressAsyncHandler = require("express-async-handler")
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler")
const createError = require("../tools/createError")
const { FAILED, SUCCESS } = require("../tools/statusTexts");
const WhatsappService = require("../tools/whatsappClient"); // now w small
const { MessageMedia } = require("whatsapp-web.js");

const whatsappService = new WhatsappService();
const whatsappId = 'test-whatsapp'

const initializeWhatsApp = expressAsyncHandler(async (req, res, next) => {

    const status = await whatsappService.getClientStatus(whatsappId)

    if (status) {
        return next(createError('الواتس فعال بالفعل', 404, FAILED))
    }

    const result = await whatsappService.initialize(whatsappId);
    console.log('end Iniltializing ==>')

    const qrCode = await whatsappService.getQrCode(whatsappId);
    console.log('end QrCode ==>')

    if (!qrCode) {
        return res.status(200).json({ message: 'تم اعاده تشغيل واتساب' })
    }

    const img = Buffer.from(qrCode.split(',')[1], 'base64');
    const base64Img = img.toString('base64');

    res.json({
        values: `data:image/png;base64,${base64Img}`,
    });
    // const img = Buffer.from(qrCode.split(',')[1], 'base64');
    // res.setHeader('Content-Type', 'image/png');
    // res.send(img);
})

const closeWhatsapp = expressAsyncHandler(async (req, res, next) => {
    const { isLogout: isLogoutQuery } = req.query
    const isLogout = isLogoutQuery === 'true'

    const status = await whatsappService.getClientStatus(whatsappId)

    if (!status) {
        return next(createError('الواتس غير فعال بالفعل', 404, FAILED))
    }
    await whatsappService.cleanup(whatsappId, isLogout)
    res.status(200).json({ status: SUCCESS, message: isLogout ? 'تم تسجيل الخروج من واتس اب و اصبح غير فعال' : "واتس اب غير فعال" })
})

const activateByQr = expressAsyncHandler(async (req, res, next) => {

    const qrCode = await whatsappService.getQrCode(whatsappId);

    if (!qrCode) {
        return next(createError('Qrcode Not Found', 404, FAILED));
    }

    const img = Buffer.from(qrCode.split(',')[1], 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(img);
})
const whatsStatusMiddleware = expressAsyncHandler(async (req, res, next) => {
    const status = await whatsappService.getClientStatus(whatsappId);

    if (!status) {
        return next(createError("الواتس غير فعال", 400, FAILED))
    }
    next()
})

const getWhatsStatus = expressAsyncHandler(async (req, res, next) => {
    const status = await whatsappService.getClientStatus(whatsappId);

    if (!status) {
        return res.status(200).json({ status: SUCCESS, values: { isValid: false } });
    }
    res.status(200).json({ status: SUCCESS, values: { isValid: true, status } });
})

const sendWhatsMessage = expressAsyncHandler(async (req, res, next) => {
    const { to, message } = req.body
    // console.log('to ==>', to, 'message ==>', message)
    const result = await whatsappService.sendMessage(whatsappId, to, message.toString());
    res.status(200).json({ message: 'send successfully', status: SUCCESS, values: result })
})

const sendWhatsMsgFc = (phone, message) => {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await whatsappService.sendMessage(whatsappId, phone, message.toString());
            resolve(true)
        } catch (error) {
            reject(error)
            return
        }
    })
}

const sendWhatsFileFc = async (phone, filePath, isBytes = false, fileName = 'report.pdf') => {
    return new Promise(async (resolve, reject) => {
        try {
            // let media
            // if (isBytes) {
            //     const fileBase = filePath.toString('base64');
            //     media = new MessageMedia('application/pdf', fileBase, fileName)
            // } else {
            //     media = MessageMedia.fromFilePath(filePath);
            // }
            // const result = await whatsappService.sendMessage(whatsappId, phone, media);
            const result = await whatsappService.sendFile(whatsappId, phone, filePath,fileName );
            resolve(true)
        } catch (error) {
            console.log('error from sendWhatsFile', error)
            reject(error)
            return
        }
    })
}

module.exports = {
    initializeWhatsApp, closeWhatsapp, activateByQr, getWhatsStatus, whatsStatusMiddleware, sendWhatsMessage,
    sendWhatsMsgFc, sendWhatsFileFc
} 