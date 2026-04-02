const { sendWhatsMsgFc } = require("../../controllers/whatsappController");
const NotificationModel = require("../../models/NotificationModel");
const { senderConstants } = require("../constants/sendersConstants");
const createError = require("../createError");
const sendEmail = require("../sendEmail");
const sendUserReport = require("../sendUserReport");
const { FAILED } = require("../statusTexts");

const senderByMethod = async ({ method, user, subject, message, ...others }) => {
    try {
        const handledMsgWhatsapp = `*${subject}*\n${message}`

        switch (method) {
            case senderConstants.EMAIL:
                const email = user.email
                await sendEmail({ email, subject: subject, html: message })
                break;
            case senderConstants.WHATSAPP:
                await sendWhatsMsgFc(user.phone, handledMsgWhatsapp)
                break;
            case senderConstants.REPORT_USER_WHATSAPP:
                await sendUserReport({ user, phoneToSend: user.phone, caption: handledMsgWhatsapp, ...others })
                break;
            case senderConstants.FAMILY_WHATSAPP:
                await sendWhatsMsgFc(user.familyPhone, handledMsgWhatsapp)
                break;
            case senderConstants.REPORT_FAMILY_WHATSAPP:
                await sendUserReport({ user, caption: handledMsgWhatsapp, ...others })
                break;
        }
        await NotificationModel.insertOne({
            user: user._id, subject, message, method,
        })
        return true
    } catch (error) {
        console.log('error from senderByMethod')
        throw createError(error.message, 500, FAILED)
    }
}

module.exports = senderByMethod