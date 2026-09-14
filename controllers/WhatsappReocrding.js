const expressAsyncHandler = require("express-async-handler");
const ConversationModel = require("../models/ConversationMode")
const NotificationModel = require("../models/NotificationModel")
const UserModel = require("../models/UserModel")

const { senderConstants } = require("../tools/constants/sendersConstants");
const { getAll, deleteOne, updateOne } = require("./factoryHandler");


const conversationParams = (query) => {
    return [
        { key: "phone", value: query.phone },
    ]
}
// ✅ Clean helper
const getSnippet = (type, defaultMsg) => {
    const snippets = {
        sticker: '🪄 Sticker',
        file: '📎 File',
        image: '🖼️ Image Inserted',
        audio: '🎵 Audio Inserted',
        video: '🎬 Video Inserted',
        document: ' Document Inserted',
        reaction: ' Reaction Applied',
        edit: 'Message has been edited',
        delete: 'Message has been deleted',
    }
    return snippets[type] ?? defaultMsg
}
const relatedModels = [
    { model: NotificationModel, field: 'phone', parentId: 'phone' },
];

const getConversations = getAll(ConversationModel, 'conversations', conversationParams)
const removeConversation = deleteOne(ConversationModel, [], relatedModels)
const updateConversation = updateOne(ConversationModel)


const markSeen = expressAsyncHandler(async (req, res, next) => {
    const phone = req.body.phone
    await Promise.all([
        await ConversationModel.updateOne({ phone }, { unreadCount: 0 }),
        await NotificationModel.updateMany({ phone, direction: 'inbound' }, { isSeen: true })
    ])
    res.status(204).json()
})

const ignoreConversation = async (message) => {
    const ignoreList = ['.ignore', '/ignore']
    if (!ignoreList.includes(message.message)) return //record msg
    await ConversationModel.updateOne({ phone: message.phone }, { ignored: true })
}

const createConversation = async (conversation, lastMessage) => {
    const isIncoming = lastMessage.direction === 'inbound'

    const user = await UserModel.findOne({
        $or: [
            { phone: conversation.phone },
            { familyPhone: conversation.phone }
        ]
    }).lean().select('_id name phone familyPhone')

    const role = !user ? 'unknown'
        : user.phone === conversation.phone ? 'user'
            : 'family'
    const userId = user?._id

    // Step 1: upsert — create if not exists, always update lastMessage
    await ConversationModel.findOneAndUpdate(
        { phone: conversation.phone },
        {
            $set: {
                lastMessage,
                ...(userId && { userId, role }),
                ...((isIncoming && conversation.name !== 'unknown') && { name: conversation.name }) // collapse step 2 here
            },
            $setOnInsert: {
                phone: conversation.phone,
            },
            $inc: { unreadCount: isIncoming ? 1 : 0 },
        },
        { upsert: true }
    )
}

const handleMeta = async (message) => {
    if (!message.meta) return
    const phone = message.phone
    const type = message?.type

    const meta = message.meta
    const messageId = meta.targetMessageId

    if (type === 'edit') {
        console.log('edit ==>', messageId)
        await NotificationModel.updateOne({ messageId }, { edited: true })
    } else if (type === 'delete') {
        console.log('delete ==>', messageId)
        await NotificationModel.updateOne({ messageId }, { deleted: true })
    } else if (type === 'status') {
        console.log('status ==>', messageId)
        await NotificationModel.updateOne({ messageId }, { isSeen: true })
    } else if (type === 'reaction') {
        console.log('Reaction ==>', messageId, meta.removed)
        if (meta.removed) {
            await NotificationModel.updateOne(
                { messageId },
                {
                    $pull: {
                        reactions: {
                            phone
                        }
                    }
                }
            );
        } else {
            await NotificationModel.updateOne(
                { messageId },
                {
                    $push: {
                        reactions: {
                            phone,
                            emoji: meta.emoji
                        }
                    }
                }
            );
        }
    }
    return
}

const handleMessage = async (message) => {
    //Reactions
    if (message.meta) return

    const createdMessage = await NotificationModel.create({ //User
        method: senderConstants.WHATSAPP, isSeen: false,

        phone: message.phone, direction: message.direction,
        messageId: message.messageId,
        type: message.type, message: message.text, media: message.media,
    })
    return createdMessage
}

// ── Unified entry point ──────────────────────────────────────────────────────
const processIncomingMessage = async (payload) => {
    try {
        if (payload.type === 'unknown') return

        const conversation = await ConversationModel.findOne({ phone: payload.phone }).lean().select('ignored')
        if (conversation?.ignored) return

        const [_, message] = await Promise.all([
            handleMeta(payload),
            handleMessage(payload),
        ]);

        if (message) {
            const lastMessage = {
                id: message._id,
                type: message.type,
                message: getSnippet(payload.type, message.message),
                direction: message.direction,
                createdAt: message.createdAt
            }
            await createConversation(payload, lastMessage)
            await ignoreConversation(message)
        }

    } catch (error) {
        throw error
    }
};

module.exports = {
    createConversation, handleMeta, handleMessage, processIncomingMessage,
    getConversations, markSeen, removeConversation, updateConversation
}