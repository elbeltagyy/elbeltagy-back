const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    },
    authStrategy: new LocalAuth({
        clientId: 'test_client_id',
    })
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

module.exports = client


// ##Used Code

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require("qrcode-terminal")
const fs = require('fs')

const createError = require('./createError');
const { FAILED } = require('./statusTexts');

class WhatsappService {
    constructor() {
        this.logger = console; // Replace with a proper logger if needed
        this.TIMEOUT_SECONDS = 10; // seconds
        this.STATES = {
            CONNECTED: 'CONNECTED',
            DISCONNECTED: 'DISCONNECTED',
            INITIALIZING: 'INITIALIZING',
        };

        this.qrCodes = new Map();
        this.clients = new Map();
        this.clientStates = new Map();
        this.SESSION_DIR = 'whatsapp-session'

        this.initializeSessionDirectory();
    }

    initializeSessionDirectory() {
        try {
            if (!fs.existsSync(this.SESSION_DIR)) {
                fs.mkdirSync(this.SESSION_DIR, { recursive: true });
            }
        } catch (error) {
            this.logger.error(`Failed to create session directory: ${error.message}`);
            throw new Error('Service initialization failed');
        }
    }

    async initialize(userId) {
        if (!userId) {
            throw createError('UserId Not Found', 404, FAILED);
        }

        if (this.qrCodes.has(userId)) {
            return;
        }

        try {
            this.clientStates.set(userId, this.STATES.INITIALIZING);
            const client = this.createClient(userId);
            await this.setupClient(client, userId);
            return this.getQrCode(userId);
        } catch (error) {
            this.clientStates.delete(userId);
            this.logger.error(`Failed to initialize client ${userId}: ${error.message}`);
            throw new Error('Failed to initialize WhatsApp client');
        }
    }

    createClient(userId) {
        return new Client({
            authStrategy: new LocalAuth({
                clientId: userId,
                dataPath: this.SESSION_DIR,
            }),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true,
            },
        });
    }

    async setupClient(client, userId) {
        client.on('qr', async (qr) => {
            this.logger.log(`QR Code received for client ${userId}`);
            try {
                const url = await qrcode.toDataURL(qr);
                // qrcodeTerminal.generate(qr, { small: true });

                // console.log('qrrrrrrrrrrrrrrrrrrrrrr', qr)
                this.qrCodes.set(userId, url);
            } catch (error) {
                this.logger.error(`Failed to generate QR code: ${error.message}`);
            }
        });

        client.on('loading_screen', (percent, message) => {
            this.logger.log(`Loading screen for client ${userId}: ${percent}% - ${message}`);
        });

        client.on('ready', () => {
            this.logger.log(`Client ${userId} is ready`);
            this.qrCodes.set(userId, null);
            this.clientStates.set(userId, this.STATES.CONNECTED);
        });

        client.on('auth_failure', (msg) => {
            this.logger.error(`Authentication failed for client ${userId}: ${msg}`);
            this.cleanup(userId);
        });

        client.on('disconnected', (reason) => {
            this.logger.warn(`Client ${userId} disconnected. Reason: ${reason}`);
            this.clientStates.set(userId, this.STATES.DISCONNECTED);
        });

        try {
            this.logger.log(`Initializing client ${userId}...`);
            await client.initialize();
            this.logger.log(`Client ${userId} initialization completed`);
            this.clients.set(userId, client);
        } catch (error) {
            this.logger.error(`Failed to initialize client ${userId}: ${error.message}`);
            throw error;
        }
    }

    async ensureClientInitialized(userId) {
        if (!this.clients.has(userId)) {
            await this.initialize(userId);
        }

        return this.waitForClientReady(userId);
    }

    waitForClientReady(userId) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                const client = this.clients.get(userId);
                const elapsed = (Date.now() - startTime) / 1000;

                if (elapsed > this.TIMEOUT_SECONDS) {
                    reject(new Error('Client initialization timeout'));
                    return;
                }

                if (client && this.clientStates.get(userId) === this.STATES.CONNECTED) {
                    resolve(client);
                } else {
                    setTimeout(check, 200);
                }
            };

            check();
        });
    }

    async sendMessage(userId, to, message) {
        try {
            const chatId = "2" + to + '@c.us'
            const client = this.clients.get(userId)
            // const numberId = await client.getNumberId(chatId); // 'to' should be the phone number with country code

            // if (!numberId) {
            //     throw new Error(`Number ${to} is not on WhatsApp`);
            // }
            // console.log(client)
            const response = await client.sendMessage(chatId, message);
            return { success: true, messageId: response.id.id };
        } catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`);
            throw new Error('Failed to send message');
        }
    }

    async sendFile(userId, to, filePath) {
        try {
            const chatId = "2" + to + '@c.us'
            const client = this.clients.get(userId)

            const media = MessageMedia.fromFilePath(filePath);
            const result = await client.sendMessage(chatId, media);

            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to send message: ${error.message}`);
            throw new Error('Failed to send File');
        }
    }

    async getClientStatus(userId) {
        try {
            const client = this.clients.get(userId)
            // console.log('client from getClient status', client)
            if (!client) return false

            const state = await client.getState();
            return state;
        } catch (error) {
            this.logger.error(`Failed to get client status: ${error.message}`);
            throw new Error('Failed to get client status');
        }
    }

    async getQrCode(userId) {
        return this.qrCodes.get(userId) || null;
    }

    async cleanup(userId, isLogout) {
        const client = this.clients.get(userId)
        this.clients.delete(userId);
        this.qrCodes.delete(userId);
        this.clientStates.delete(userId);

        if (isLogout) {
            console.log('islogout')
            await client.logout();
        }
        await client.destroy()
        console.log('destroy')
    }
}

module.exports = WhatsappService;
// #################### beiley
let makeWASocket, useMultiFileAuthState, DisconnectReason;
const pino = require("pino");

(async () => {
    const baileys = await import('@whiskeysockets/baileys');
    makeWASocket = baileys.makeWASocket;
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
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

        // أنشئ الـ socket
        const sock = makeWASocket({
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
        console.log('res ==>', res)
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
