const EventEmitter = require("events");
let makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage;
(async () => {
  const baileys = await import("@whiskeysockets/baileys");
  makeWASocket = baileys.makeWASocket;
  useMultiFileAuthState = baileys.useMultiFileAuthState;
  DisconnectReason = baileys.DisconnectReason;
  fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;
  downloadMediaMessage = baileys.downloadMediaMessage
})();

const qrcode = require("qrcode");
const fs = require("fs");
const path = require("path");
const createError = require("./createError");
const { FAILED } = require("./statusTexts");
const pino = require("pino");
const mime = require('mime-types'); // npm i mime-types
// const { createConversation } = require("../controllers/whatsappController");
const { getNational } = require("./fcs/handelPhones");
const { handleMeta, processIncomingMessage } = require("../controllers/WhatsappReocrding");

function deleteSessionFolder(userId, sessionDir) {
  const userSessionPath = path.join(sessionDir, userId);
  if (fs.existsSync(userSessionPath)) {
    fs.rmSync(userSessionPath, { recursive: true, force: true });
    console.log(`Session folder deleted for ${userId}`);
  }
}

// Helper: strip @s.whatsapp.net / @g.us suffix, return plain number
function normalizeJid(jid = "") {
  return jid.replace(/@.+$/, "");
}

function pipeWithGuards(readable, writable, { maxBytes, timeoutMs }) {
  return new Promise((resolve, reject) => {
    let received = 0;

    const timeout = setTimeout(() => {
      readable.destroy(new Error('Download timeout exceeded'));
    }, timeoutMs);

    readable.on('data', (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        readable.destroy(new Error(`File exceeds size limit (${maxBytes} bytes)`));
      }
    });

    readable.on('error', (err) => {
      clearTimeout(timeout);
      writable.destroy();
      reject(err);
    });

    writable.on('error', (err) => {
      clearTimeout(timeout);
      readable.destroy();
      reject(err);
    });

    writable.on('finish', () => {
      clearTimeout(timeout);
      resolve();
    });

    readable.pipe(writable);
  });
}

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    throw error;
  }
}

async function downloadMediaStream(sock, rawMsg, normalizedMsg) {
  const { media, messageId } = normalizedMsg;
  if (!media) return null;

  const ext = mime.extension(media.resource_type) || 'bin';
  const filename = `${messageId}.${ext}`;
  const savePath = path.join('storage', 'whatsapp', filename);
  const tmpPath = savePath + '.tmp'; // write to .tmp first

  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  const writeStream = fs.createWriteStream(tmpPath);

  try {
    const mediaStream = await downloadMediaMessage(
      rawMsg,
      'stream',         // ✅ stream mode — no full buffer in RAM
      {},
      {
        logger: console,
        reuploadRequest: sock.updateMediaMessage,
      }
    );

    // pipe with timeout + size limit
    await pipeWithGuards(mediaStream, writeStream, {
      maxBytes: 500 * 1024 * 1024, // 500MB hard limit — adjust as needed
      timeoutMs: 5 * 60 * 1000,    // 5 min max download time
    });

    // only rename to final path if fully successful
    fs.renameSync(tmpPath, savePath);
    const url = process.env.http + '/storage/whatsapp/' + filename
    return { filename, url, resource_type: media.resource_type };

  } catch (err) {
    // clean up partial/tmp file on any error
    safeUnlink(tmpPath);
    safeUnlink(savePath);
    throw err;
  }
}

class WhatsappService extends EventEmitter {
  constructor() {
    super();
    this.clientStates = new Map();
    this.retryCounts = new Map();
    this.reconnecting = new Map();
    this.maxRetries = 5;

    this.clients = new Map();
    this.authStates = new Map();
    this.qrCodes = new Map();
    this.recordMessages = new Map(); // userId => boolean

    this.SESSION_DIR = "whatsapp-session";
    this.ensureSessionDir();
  }

  ensureSessionDir() {
    if (!fs.existsSync(this.SESSION_DIR)) {
      fs.mkdirSync(this.SESSION_DIR, { recursive: true });
    }
  }

  async initialize(userId, params = {}) {
    if (!userId) throw new Error("UserId is required");
    if (this.clients.has(userId)) return this.getQrCode(userId);

    const authFolder = path.join(this.SESSION_DIR, userId);
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();
    if (params.recordMessages) {
      this.recordMessages.set(userId, true)
    }

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "error" }),
    });

    sock.ev.on("creds.update", saveCreds);

    // ─── Incoming messages ────────────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (!this.recordMessages.get(userId)) return;

      // type === 'notify'  → new real-time message
      // type === 'append'  → history sync (skip these usually)
      console.log('WA:: type ===>', type,)
      console.log('WA:: messages ===>', messages)
      // if (type !== "notify") return;
      for (const msg of messages) {
        if (msg.key?.remoteJid === "status@broadcast") continue;

        try {
          const payload = await this._buildMessagePayload(userId, msg);
          if (payload.isGroup) continue
          await processIncomingMessage(payload); // ✅ awaited, errors caught
        } catch (err) {
          throw err
        }
      }
    });

    // ─── Message status updates (sent / delivered / read receipts) ────────────
    //Only with delete Events
    //Status 4 ===> read
    sock.ev.on("messages.update", (updates) => {
      if (!this.recordMessages.get(userId)) return;

      for (const update of updates) {
        console.log('update ==>', update)

        if (update.update.status === 4) {
          handleMeta({
            type: 'status',
            meta: {
              targetMessageId: update.key.id,
              isSeen: true
            }
          })
        }
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const url = await qrcode.toDataURL(qr);
        this.qrCodes.set(userId, url);
      }

      if (connection === "open") {
        console.log(`Client ${userId} connected`);
        this.retryCounts.set(userId, 0);
        this.clientStates.set(userId, "CONNECTED");
        this.qrCodes.set(userId, null);
        this.emit("client:connected", { userId });
      }

      if (connection === "close") {
        if (this.reconnecting.get(userId)) return;
        const retries = (this.retryCounts.get(userId) || 0) + 1;
        if (retries > this.maxRetries) {
          console.log(`Max retries reached for ${userId}. Giving up.`);
          this.emit("client:failed", { userId });
          return;
        }
        this.retryCounts.set(userId, retries);

        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(`Client ${userId} closed:`, reason);
        this.clients.delete(userId);
        this.authStates.delete(userId);
        this.qrCodes.delete(userId);
        this.emit("client:disconnected", { userId, reason });

        if (reason !== DisconnectReason.loggedOut) {
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
          }, 2500);
        } else {
          deleteSessionFolder(userId, this.SESSION_DIR);
        }
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));

    this.clients.set(userId, sock);
    this.authStates.set(userId, { state, saveCreds });

    return this.getQrCode(userId);
  }

  // ─── Payload builder ────────────────────────────────────────────────────────

  /**
   * Normalises a raw Baileys message into a consistent shape.
   *
   * payload = {
   *   userId,      — your internal user/account id
   *   direction,   — "in" | "out"
   *   messageId,   — Baileys msg.key.id
   *   from,        — sender phone number (no suffix)
   *   to,          — recipient (fromMe messages only)
   *   isGroup,     — bool
   *   groupId,     — group jid (isGroup only)
   *   type,        — "text" | "image" | "video" | "audio" | "document" | "sticker" | "unknown"
   *   text,        — plain-text body or caption (may be null)
   *   media,       — { mimetype, url, fileName? } or null
   *   timestamp,   — unix ms
   *   raw,         — original Baileys message object
   * }
   */
  async _buildMessagePayload(userId, msg) {
    const jid = msg.key.remoteJid || "";
    const isGroup = jid.endsWith("@g.us");

    const number = msg.key.remoteJidAlt || msg.key.remoteJid
    const normalizedPhone = normalizeJid(number)
    const phone = getNational(normalizedPhone)

    const name = !msg.key.fromMe ? msg.pushName : 'unknown'
    const direction = msg.key.fromMe ? 'outbound' : 'inbound'

    //Fetch Conversation, to or from has that phone
    const m = msg.message || {};

    // Resolve message type and content
    let type = "unknown";
    let text = null;
    let media = null;
    let meta = null;   // ← extra structured data for special types

    console.log(m.conversation || m.extendedTextMessage)
    if (m.conversation || m.extendedTextMessage) {
      type = "text";
      text = m.conversation || m.extendedTextMessage?.text || null;
    } else if (m.imageMessage) {
      type = "image";
      text = m.imageMessage.caption || null;
      media = { resource_type: m.imageMessage.mimetype, url: m.imageMessage.url };
    } else if (m.videoMessage) {
      type = "video";
      text = m.videoMessage.caption || null;
      media = { resource_type: m.videoMessage.mimetype, url: m.videoMessage.url };
    } else if (m.audioMessage) {
      type = "audio";
      media = { resource_type: m.audioMessage.mimetype, url: m.audioMessage.url };
    } else if (m.documentMessage) {
      type = "document";
      text = m.documentMessage.caption || null;
      media = {
        resource_type: m.documentMessage.mimetype,
        url: m.documentMessage.url,
        fileName: m.documentMessage.fileName,
      };
    } else if (m.stickerMessage) {
      type = "sticker";
      media = { resource_type: m.stickerMessage.mimetype, url: m.stickerMessage.url };
    } else if (m.reactionMessage) {
      type = "reaction";
      meta = {
        targetMessageId: m.reactionMessage.key?.id,      // original msg id
        targetFromMe: m.reactionMessage.key?.fromMe,
        emoji: m.reactionMessage.text || null,  // null = reaction removed
        removed: m.reactionMessage.text === "",
      }
    } else if (m.secretEncryptedMessage) {
      const secret = m.secretEncryptedMessage;
      type = "edit";
      meta = {
        targetMessageId: secret.targetMessageKey?.id,
        targetFromMe: secret.targetMessageKey?.fromMe,
        targetJid: secret.targetMessageKey?.remoteJid,
        newText: null,  // encrypted, can't read
        encrypted: true,
      };
    }

    if (msg.message?.protocolMessage?.type === 0) {
      //Delete
      type = 'delete'
      meta = {
        targetMessageId: msg.message.protocolMessage.key?.id
      }
    }

    //Modify response messageId = edited
    //Add Meta - handel it in Controller
    // msg.message.protocolMessage.key.id // this is targetMessageId
    // console.log('meta ==>', { meta, type, msg, protocolMessage: msg.message.protocolMessage }) // in delete protocolMessage.type === 0

    const response = {
      userId, phone, name,
      direction,
      messageId: msg.key.id,
      isGroup, groupId: isGroup ? jid : null,
      type, text, media,
      meta,
      // timestamp: (msg.messageTimestamp?.toNumber?.() ?? msg.messageTimestamp ?? 0) * 1000,
      raw: msg,
    };

    const sock = this.clients.get(userId);
    if (media) {
      response.media = await downloadMediaStream(sock, msg, response);
    }
    return response
  }

  // ─── Send helpers (emit message:out after successful send) ─────────────────

  async sendMessage(userId, to, messageText) {
    const sock = this.clients.get(userId);
    if (!sock) throw createError("الواتساب غير فعال", 400, FAILED);

    const jid = 2 + `${to}@s.whatsapp.net`;
    const sent = await sock.sendMessage(jid, { text: messageText });

    /**
     * Emit: "message:out"
     */
    this.emit("message:out", {
      userId,
      messageId: sent?.key?.id,
      to,
      type: "text",
      content: messageText,
      timestamp: Date.now(),
    });

    return { success: true, messageId: sent?.key?.id };
  }

  async sendMedia(userId, to, fileBuffer, fileName, others = {}) {
    const sock = this.clients.get(userId);
    if (!sock) throw createError("الواتساب غير فعال", 400, FAILED);

    const jid = 2 + `${to}@s.whatsapp.net`;
    const mimetype = others.mimetype || "application/pdf";
    const caption = others.caption || fileName;

    // حدد نوع الرسالة بناءً على الـ mimetype
    let messageContent;

    if (mimetype.startsWith("audio/")) {
      messageContent = {
        audio: fileBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: others.ptt ?? true, // true = voice note, false = audio file
      };
    } else if (mimetype.startsWith("image/")) {
      messageContent = {
        image: fileBuffer,
        mimetype,
        caption,
      };
    } else if (mimetype.startsWith("video/")) {
      messageContent = {
        video: fileBuffer,
        mimetype,
        caption,
      };
    } else {
      // document fallback
      messageContent = {
        document: fileBuffer,
        mimetype,
        fileName,
        caption,
      };
    }
    console.log(messageContent)
    const sent = await sock.sendMessage(jid, messageContent);

    this.emit("message:out", {
      userId,
      messageId: sent?.key?.id,
      to,
      type: mimetype.split("/")[0], // "audio" | "image" | "video" | "application"
      fileName,
      caption,
      timestamp: Date.now(),
    });

    return { success: true, messageId: sent?.key?.id };
  }
  // ─── Remaining helpers (unchanged) ─────────────────────────────────────────

  getQrCode(userId) {
    return this.qrCodes.get(userId) || null;
  }

  async getClientStatus(userId) {
    const hasClient = !!this.clients.get(userId);
    const hasQrcode = !!this.qrCodes.get(userId);
    const recordMessages = this.recordMessages.get(userId)
    return { isActive: hasClient && !hasQrcode, recordMessages };
  }


  async cleanup(userId, isLogout) {
    const sock = this.clients.get(userId);
    this.clients.delete(userId);
    this.authStates.delete(userId);
    this.qrCodes.delete(userId);
    this.recordMessages.delete(userId)

    if (isLogout) {
      try {
        deleteSessionFolder(userId, this.SESSION_DIR);
        if (sock) await sock.logout();
      } catch (e) {
        console.log("from cleanup whatsapp ==>", e.message);
      }
    }
  }
}

module.exports = WhatsappService;