let makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion;
const pino = require("pino");

(async () => {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.makeWASocket;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
})();

const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const createError = require('./createError');
const { FAILED } = require('./statusTexts');


function deleteSessionFolder(userId, sessionDir) {
    const userSessionPath = path.join(sessionDir, userId);
    if (fs.existsSync(userSessionPath)) {
        fs.rmSync(userSessionPath, { recursive: true, force: true });
        console.log(`Session folder deleted for ${userId}`);
    }
}

class WhatsappService {
    constructor() {
        this.clientStates = new Map()
        this.retryCounts = new Map();
        this.reconnecting = new Map();
        this.maxRetries = 5;  // limit retries

        this.clients = new Map();   // userId → socket
        this.authStates = new Map(); // userId → { state, saveCreds }
        this.qrCodes = new Map();   // userId → qr data URL or null
        this.SESSION_DIR = 'whatsapp-session';
        this.ensureSessionDir();
    }

    ensureSessionDir() {
        if (!fs.existsSync(this.SESSION_DIR)) {
            fs.mkdirSync(this.SESSION_DIR, { recursive: true });
        }
    }

    async initialize(userId) {
        if (!userId) throw new Error('UserId is required');

        if (this.clients.has(userId)) {
            return this.getQrCode(userId);
        }

        // إعداد حالة المصادقة
        const authFolder = path.join(this.SESSION_DIR, userId);
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const { version } = await fetchLatestBaileysVersion()
        // أنشئ الـ socket
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "error" }) // only show errors
            // logger: console, // أو استخدم pino logger لو تحب
        });
        // احفظ بيانات الاعتماد عند التحديث
        sock.ev.on('creds.update', saveCreds);

        // استمع للتحديث في الاتصال (بما في ذلك استقبال QR) :contentReference[oaicite:1]{index=1}
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                // توليد QR صورة كمُلّف بيانات URL
                const url = await qrcode.toDataURL(qr);
                this.qrCodes.set(userId, url);
            }

            if (connection === 'open') {
                console.log('Connected open')
                this.retryCounts.set(userId, 0); // reset on success

                this.clientStates.set(userId, 'CONNECTED');

                // تم الاتصال بنجاح
                this.qrCodes.set(userId, null);
                console.log(`Client ${userId} connected`);
            }

            if (connection === 'close') {
                if (this.reconnecting.get(userId)) return;
                // Stop if too many retries
                const retries = (this.retryCounts.get(userId) || 0) + 1;
                if (retries > this.maxRetries) {
                    console.log(`Max retries reached for ${userId}. Giving up.`);
                    return;
                }
                this.retryCounts.set(userId, retries);

                const reason = lastDisconnect?.error?.output?.statusCode;
                console.log(`Client ${userId} has been Closed closed:`, reason);
                this.clients.delete(userId);
                this.authStates.delete(userId);
                this.qrCodes.delete(userId);

                // Reconnect if not a logout
                if (reason !== DisconnectReason.loggedOut) {
                    console.log(`Reconnecting ${userId}...`);
                    this.reconnecting.set(userId, true);

                    setTimeout(async () => {
                        try {
                            this.clients.delete(userId);
                            await this.initialize(userId);
                        } catch (e) {
                            console.log(`Reconnect failed: ${e.message}`);
                        } finally {
                            this.reconnecting.set(userId, false);
                        }
                    }, 2500); // wait 3s before retry
                } else {
                    deleteSessionFolder(userId, this.SESSION_DIR)
                    console.log(`Session logged out. Delete session files for ${userId} if needed.`);
                }

            }
        });
        await new Promise(resolve => setTimeout(resolve, 2500)); // waits 4 seconds

        // احفظ الربط
        this.clients.set(userId, sock);
        this.authStates.set(userId, { state, saveCreds });
        return this.getQrCode(userId);
    }

    getQrCode(userId) {
        return this.qrCodes.get(userId) || null;
    }

    async sendMessage(userId, to, messageText) {
        const sock = await this.clients.get(userId);
        if (!sock) throw createError("الواتساب غير فعال", 400, FAILED)

        const jid = 2 + `${to}@s.whatsapp.net`;
        const res = await sock.sendMessage(jid, { text: messageText });
        // console.log('res from send Msg ==>', res)
        return { success: true };
    }

    async sendFile(userId, to, fileBuffer, fileName) {
        const sock = await this.clients.get(userId);
        if (!sock) throw createError("الواتساب غير فعال", 400, FAILED)

        const jid = 2 + `${to}@s.whatsapp.net`;
        // Send file using Baileys
        await sock.sendMessage(jid, {
            document: fileBuffer,
            mimetype: "application/pdf",
            fileName
        });

        // يمكنك تحديد النوع (image, video, document...) بناء على الامتداد
        // if (caption) content.caption = caption;

        return { success: true }
    }

    async getClientStatus(userId) {
        const hasClient = !!this.clients.get(userId)
        const hasQrcode = !!this.qrCodes.get(userId)

        console.log('Client status ===>', hasClient && !hasQrcode)
        return hasClient && !hasQrcode
    }

    async cleanup(userId, isLogout) {
        const sock = this.clients.get(userId);
        if (!sock) throw createError('الواتساب غير فعال بالفعل', 400, FAILED)
        this.clients.delete(userId);
        this.authStates.delete(userId);
        this.qrCodes.delete(userId);

        if (isLogout && sock) {
            try {
                await sock.logout();
            } catch (e) {
                console.log('from cleanup whastapp ==>', e.message)
                // ممكن يكون قد تم تسجيل الخروج مسبقًا
            }
        }
    }
}



module.exports = WhatsappService;