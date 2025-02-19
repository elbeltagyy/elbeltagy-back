const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcodeTerminal = require("qrcode-terminal")

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

        // this.initializeSessionDirectory();
    }

    // initializeSessionDirectory() {
    //     try {
    //         if (!fs.existsSync(this.SESSION_DIR)) {
    //             fs.mkdirSync(this.SESSION_DIR, { recursive: true });
    //         }
    //     } catch (error) {
    //         this.logger.error(`Failed to create session directory: ${error.message}`);
    //         throw new Error('Service initialization failed');
    //     }
    // }

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
                // dataPath: this.SESSION_DIR,
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