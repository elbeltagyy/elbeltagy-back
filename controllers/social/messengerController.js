const expressAsyncHandler = require("express-async-handler");
const SocialModel = require("../../models/SocialModel");
const SocialConstants = require("../../tools/constants/social");
const axiosInstance = require("../../tools/fcs/axios");
const createError = require("../../tools/createError");
const { SUCCESS, FAILED } = require("../../tools/statusTexts");

const FormData = require('form-data');
const fs = require('fs');


const webhookMessage = expressAsyncHandler(async (req, res, next) => {

})

const getConversations = expressAsyncHandler(async (req, res, next) => {
    const { pageId, after, before } = req.query;

    const social = await SocialModel.findOne({ type: SocialConstants.MESSENGER });

    const page = social.pages.find(p => p.id === pageId);
    if (!page) return next(createError("Page Not Found", 404))

    const { data } = await axiosInstance.get(
        `https://graph.facebook.com/v25.0/${pageId}/conversations`,
        {
            params: {
                access_token: page.access_token,
                platform: 'messenger',
                fields: 'id,snippet,updated_time,message_count,unread_count,participants',
                limit: 1,
                ...(after && { after }),
                ...(before && { before }),
            },
        }
    );
    const paging = {}
    paging.after = data?.paging.next && data?.paging.cursors?.after
    paging.before = data?.paging.previous && data?.paging.cursors?.before

    res.status(200).json({ values: { conversations: data.data, paging }, status: SUCCESS });
});

const getMessages = expressAsyncHandler(async (req, res) => {
    const conversationId = req.params.id
    const { pageId, after, before } = req.query;

    const social = await SocialModel.findOne({ type: SocialConstants.MESSENGER });
    const page = social.pages.find(p => p.id === pageId);

    const { data } = await axiosInstance.get(
        `https://graph.facebook.com/v25.0/${conversationId}/messages`,
        {
            params: {
                access_token: page.access_token,
                fields: 'id,message,from,to,created_time,attachments',
                limit: 100,
                ...(after && { after }),
                ...(before && { before }),
            },
        }
    );

    const paging = {}
    paging.after = data?.paging.next && data?.paging.cursors?.after
    paging.before = data?.paging.previous && data?.paging.cursors?.before

    res.status(200).json({ values: { messages: data.data, paging }, status: SUCCESS });
});

const replyToMessage = expressAsyncHandler(async (req, res, next) => {
    const { recipientId, text, fileUrls, pageId } = req.body;
    const files = req.files; // array from multer
    // fileUrls: JSON string array e.g. '["https://...", "https://..."]'

    const social = await SocialModel.findOne({ type: SocialConstants.MESSENGER });
    const page = social.pages.find(p => p.id === pageId);
    if (!page) return next(createError("Page Not FOund", 404, FAILED))

    if (!text && !files?.length && !fileUrls) {
        return res.status(400).json({ error: 'Provide text, files, or fileUrls' });
    }

    // Send all sequentially (Messenger requires sequential per recipient)
    const results = [];
    await axiosInstance.post(
        `https://graph.facebook.com/v25.0/${pageId}/messages`,
        {
            recipient: { id: recipientId },
            sender_action: 'mark_seen', // ← this is it
        },
        { params: { access_token: page.access_token } }
    );

    if (text) {
        const { data } = await sendText(page, { text, recipientId });
        results.push({ type: 'text', messageId: data.message_id });
    }

    if (fileUrls) {
        const urls = JSON.parse(fileUrls); // parse JSON array from body
        for (const url of urls) {
            const { data } = await sendFileUrl(page, { recipientId, type: getUrlType(url), url });
            results.push({ type: 'url', url, messageId: data.message_id });
        }
    }

    if (files?.length) {
        for (const file of files) {
            const { data } = await sendFileDisk(page, { recipientId, file });
            results.push({ type: 'file', name: file.originalname, messageId: data.message_id });
        }
    }

    res.status(200).json({ status: SUCCESS, values: results });
});


const deleteMessage = expressAsyncHandler(async (req, res) => {
    const { pageId, messageId } = req.query;

    const social = await SocialModel.findOne({ type: SocialConstants.MESSENGER });
    const page = social.pages.find(p => p.id === pageId);

    const { data } = await axiosInstance.delete(
        `https://graph.facebook.com/v25.0/${messageId}`,
        {
            params: { access_token: page.access_token }
        }
    );

    res.json({ status: SUCCESS, values: '', message: 'تم ازاله الرساله بنجاح' });
});

// Helpers
const sendText = async (page, { text = null, recipientId = null, }) => {
    return axiosInstance.post(
        `https://graph.facebook.com/v25.0/${page.id}/messages`,
        {
            recipient: { id: recipientId },
            message: { text },
            messaging_type: 'RESPONSE',
        },
        { params: { access_token: page.access_token } }
    );
};
const getUrlType = (url) => {
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    return 'file';
};


const sendFileUrl = async (page, { recipientId = null, type = null, url = null }) => {
    return axiosInstance.post(
        `https://graph.facebook.com/v25.0/${page.id}/messages`,
        {
            recipient: { id: recipientId },
            message: {
                attachment: {
                    type,
                    payload: { url, is_reusable: true },
                },
            },
            messaging_type: 'RESPONSE',
        },
        { params: { access_token: page.access_token } }
    );
};

const sendFileDisk = async (page, { recipientId, file, }) => {
    const type = file.mimetype.startsWith('image') ? 'image'
        : file.mimetype.startsWith('video') ? 'video'
            : file.mimetype.startsWith('audio') ? 'audio'
                : 'file';

    const form = new FormData();
    form.append('recipient', JSON.stringify({ id: recipientId }));
    form.append('message', JSON.stringify({
        attachment: { type, payload: { is_reusable: true } },
    }));
    form.append('messaging_type', 'RESPONSE');
    form.append('filedata', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype,
    });

    const result = await axiosInstance.post(
        `https://graph.facebook.com/v25.0/${page.id}/messages`,
        form,
        {
            params: { access_token: page.access_token },
            headers: form.getHeaders(),
        }
    );
    fs.unlinkSync(file.path);
    return result;
};

module.exports = { webhookMessage, getConversations, getMessages, replyToMessage }