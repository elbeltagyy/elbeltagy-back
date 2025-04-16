const { sendWhatsMsgFc } = require("../../controllers/whatsappController");
const senderConstants = require("../constants/sendersConstants");
const sendEmail = require("../sendEmail");
const sendUserReport = require("../sendUserReport");

const senderByMethod = async ({ method, user, subject, message }) => {
    try {
        switch (method) {
            case senderConstants.CONTACT:
                // isSkip = false
                break;
            case senderConstants.EMAIL:
                const email = user.email
                await sendEmail({ email, subject: subject, html: message })
                break;
            case senderConstants.WHATSAPP:
                await sendWhatsMsgFc(user.phone, message)
                break;
            case senderConstants.REPORT_USER_WHATSAPP:
                await sendUserReport({ user, phoneToSend: user.phone })
                break;
            case senderConstants.FAMILY_WHATSAPP:
                await sendWhatsMsgFc(user.familyPhone, message)
                break;
            case senderConstants.REPORT_FAMILY_WHATSAPP:
                await sendUserReport({ user })
                break;
        }
        return true
    } catch (error) {
        console.log('error')
    }
}

module.exports = senderByMethod