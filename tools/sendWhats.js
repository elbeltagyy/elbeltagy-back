const { MessageMedia } = require("whatsapp-web.js");
const WhatsAppClient = require("./WhatsAppClient");

const sendWhatsMsg = (phone, message) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chatId = "2" + phone + '@c.us'
            console.log(chatId, '+++chatId')
            const result = await WhatsAppClient.sendMessage(chatId, message.toString());
            resolve(true)
        } catch (error) {
            reject(error)
            return
        }
    })
}

const sendWhatsFile = async (phone, filePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const chatId = "2" + phone + '@c.us'
            const media = MessageMedia.fromFilePath(filePath);
            const result = await WhatsAppClient.sendMessage(chatId, media);
            resolve(true)
        } catch (error) {
            console.log('error from sendWhatsFile', error)
            reject(error)
            return
        }
    })
}

module.exports = { sendWhatsFile, sendWhatsMsg }