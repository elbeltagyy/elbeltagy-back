const expressAsyncHandler = require("express-async-handler");
const SocialModel = require("../../models/SocialModel");
const SocialConstants = require("../../tools/constants/social");
const { SUCCESS, FAILED } = require("../../tools/statusTexts");
const isDevelop = require("../../tools/fcs/isDevelop");
const createError = require("../../tools/createError");
const { Readable } = require("stream");
const fs = require("fs");
const FormData = require("form-data");
const axiosInstance = require("../../tools/fcs/axios");
const { subscribeMessenger } = require("../../routes/socials/messengerRoutes");

const BASE_URL = 'https://graph.facebook.com/v25.0'
const REDIRECT_URI =
    isDevelop ?
        "https://rancorous-inger-glisteringly.ngrok-free.dev/api/facebook/callback" :
        process.env.http + "/api/facebook/callback"


async function uploadPhotoUnpublished(file, pageId, token) {
    if (!file) return null
    const form = new FormData();
    if (file.buffer) {
        // memoryStorage: use buffer
        const stream = Readable.from(file.buffer);
        form.append("source", stream, { filename: file.originalname });
    } else {
        // diskStorage: use path
        form.append("source", fs.createReadStream(file.path), {
            filename: file.originalname,
        });
    }

    form.append("published", "false");
    form.append("access_token", token);

    const res = await axiosInstance.post(`${BASE_URL}/${pageId}/photos`, form, {
        headers: form.getHeaders(),
    });

    // Clean up disk file if exists
    if (file.path) fs.unlinkSync(file.path);

    return res.data.id;
}

const getType = (type) => {
    return SocialConstants.config[type]
}

const loginToFacebook = expressAsyncHandler(async (req, res, next) => {
    const type = req.query.type
    const APP_ID = getType(type).APP_ID
    const scope = getType(type).scope

    if (!type) return next(createError('Type not found', 404, FAILED))

    const params = new URLSearchParams({
        client_id: APP_ID,
        redirect_uri: REDIRECT_URI,
        scope,
        state: type,
        response_type: 'code',
    });
    res.status(200).json({ values: `https://www.facebook.com/v25.0/dialog/oauth?${params}`, status: SUCCESS, message: 'سيتم تحويلك الي الفيسبوك لتسجيل الدخول - اختر الصفحه المراد ادارتها' });
})

const facebookCallbackLogin = expressAsyncHandler(async (req, res, next) => {
    const { code, state: type } = req.query;
    if (!code) return next(createError("Something went wrong", 400, FAILED))
    if (!type) return next(createError("Something went wrong", 400, FAILED))
    const APP_ID = getType(type).APP_ID;
    const APP_SECRET = getType(type).APP_SECRET;
    if (!APP_ID || !APP_SECRET) return next(createError("Something went wrong", 400, FAILED))

    // 1. Short-lived user token
    const { data: tokenData } = await axiosInstance.get(
        'https://graph.facebook.com/v25.0/oauth/access_token',
        {
            params: {
                client_id: APP_ID,
                client_secret: APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code,
            },
        }
    );

    // 2. Exchange for long-lived user token
    const { data: longLivedData } = await axiosInstance.get(
        'https://graph.facebook.com/v25.0/oauth/access_token',
        {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: APP_ID,
                client_secret: APP_SECRET,
                fb_exchange_token: tokenData.access_token,
            },
        }
    );
    const longLivedUserToken = longLivedData.access_token;

    // 3. Get pages using long-lived token
    const { data: pagesData } = await axiosInstance.get(
        'https://graph.facebook.com/v25.0/me/accounts',
        {
            params: { access_token: longLivedUserToken },
        }
    );

    const pages = (pagesData.data || []).map(page => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
        category: page.category || '',
    }));

    // 4. Subscribe all pages (properly awaited)
    if (type === SocialConstants.MESSENGER) {
        await Promise.all(pages.map(page =>
            subscribeMessenger({ pageId: page.id, accessToken: page.access_token }) // *_*
        ));
    }

    // 5. Save to DB
    await SocialModel.findOneAndUpdate(
        { type },
        { pages, type },
        { upsert: true, new: true }
    );

    res.status(201).json({
        status: SUCCESS,
        message: 'تم ربط صفحات الفيس بنجاح : ' + pages.length + " صفحه"
    });
});

const facebookDelete = expressAsyncHandler(async (req, res, next) => {
    const type = req.body.type || SocialConstants.FACEBOOK
    console.log(type)
    await SocialModel.deleteOne({ type })
    res.status(200).json({ status: SUCCESS, message: "تم الغاء ربط صفحات الفيسبوك بنجاح" })
})

const getPages = expressAsyncHandler(async (req, res, next) => {
    const type = req.query.type || SocialConstants.FACEBOOK

    const facebookSocial = await SocialModel.findOne({ type });
    if (!facebookSocial) {
        return res.status(200).json({
            values: [],
            status: SUCCESS
        });
    }

    const pages = await Promise.all(
        facebookSocial.pages.map(async (page) => {
            const { data: details } = await axiosInstance.get(
                `https://graph.facebook.com/v25.0/${page.id}`,
                {
                    params: {
                        access_token: page.access_token,
                        fields: [
                            'id',
                            'name',
                            'username',
                            'link',
                            'likes',
                            'category',
                            'verification_status',
                            'fan_count',
                            'followers_count',
                            'picture.type(large)',
                            'cover',
                            'website',
                            'about'
                        ].join(',')
                    }
                }
            );
            return details;
        })
    );

    res.status(200).json({
        values: pages,
        status: SUCCESS
    });
});

const getPosts = expressAsyncHandler(async (req, res, next) => {
    const { pageId, after, before, sort = 'old', type = 'posts' } = req.query;
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });
    // const order = sort === 'old' ? 'chronological' : 'reverse_chronological'

    const { data } = await axiosInstance.get(
        `https://graph.facebook.com/v25.0/${pageId}/` + (type === 'posts' ? 'posts' : 'scheduled_posts'),
        {
            params: {
                access_token: page.access_token,
                fields: 'id,message,story,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),attachments{media_type,media,url,subattachments},scheduled_publish_time ',
                limit: 100,      // posts per page
                // order,
                ...(after && {
                    after
                }),
                ...(before && {
                    before
                }),
            }
        }
    );
    res.json({
        status: SUCCESS, values: data
    });
})

const createPost = expressAsyncHandler(async (req, res, next) => {
    const { pageId, message, scheduledTime } = req.body;
    // scheduledTime: ISO string or Unix timestamp e.g. "2025-07-01T15:00:00Z"

    if (!req.files?.length && !message)
        return res.status(400).json({ message: "files and message are required", status: FAILED });

    // Validate scheduledTime if provided
    let publishTime = null;
    if (scheduledTime) {
        const date = new Date(scheduledTime);
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        const sixMonths = 180 * 24 * 60 * 60 * 1000;

        if (isNaN(date.getTime()))
            return res.status(400).json({ message: "scheduledTime غير صالح", status: FAILED });

        if (date.getTime() - now < tenMinutes)
            return res.status(400).json({ message: "يجب أن يكون الجدول بعد 10 دقائق على الأقل", status: FAILED });

        if (date.getTime() - now > sixMonths)
            return res.status(400).json({ message: "لا يمكن الجدولة أكثر من 6 أشهر", status: FAILED });

        publishTime = Math.floor(date.getTime() / 1000); // Unix timestamp (seconds)
    }

    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK });
    const page = facebookSocial.pages.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    // Upload all photos concurrently
    const photoIds = req.files?.length
        ? await Promise.all(req.files.map(file => uploadPhotoUnpublished(file, page.id, page.access_token)))
        : [];

    // Build post payload
    const payload = {
        message,
        access_token: page.access_token,
        ...(photoIds.length && {
            attached_media: photoIds.map(id => ({ media_fbid: id })),
        }),
        ...(publishTime
            ? { scheduled_publish_time: publishTime, published: false } // ← schedule
            : { published: true }                                        // ← immediate
        ),
    };

    const response = await axiosInstance.post(`${BASE_URL}/${pageId}/feed`, payload);

    const isScheduled = !!publishTime;
    res.json({
        status: SUCCESS,
        values: response.data,
        message: isScheduled
            ? `تم جدولة المنشور بنجاح في ${new Date(scheduledTime).toLocaleString('ar-EG')}`
            : 'تم انشاء المنشور بنجاح',
    });
});

const updatePost = expressAsyncHandler(async (req, res, next) => {
    const { pageId, message, postId } = req.body
    if (!postId && !message)
        return res
            .status(400)
            .json({ message: "Post and message are required", status: FAILED });

    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    // Publish post with all photos
    const response = await axiosInstance.post(`${BASE_URL}/${postId}`, null, {
        params: {
            message,
            access_token: page.access_token,
        },
    });

    res.json({ status: SUCCESS, values: response.data, message: 'تم تعديل المنشور بنجاح' });
})

const deletePost = expressAsyncHandler(async (req, res, next) => {
    const { pageId, postId } = req.body
    if (!postId && !postId)
        return res
            .status(400)
            .json({ message: "Post are required", status: FAILED });

    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    const response = await axiosInstance.delete(
        `${BASE_URL}/${postId}`,
        {
            params: {
                access_token: page.access_token,
            },
        }
    );

    res.json({ status: SUCCESS, values: response.data, message: 'تم حذف المنشور بنجاح' });
})

const getPostComments = expressAsyncHandler(async (req, res) => {
    const postId = req.params.postId
    const { pageId } = req.query;
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages?.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    let allComments = [];
    let nextUrl = null;

    const { data } = await axiosInstance.get(
        `${BASE_URL}/${postId}/comments`,
        {
            params: {
                access_token: page.access_token,
                fields: `
                id,
                message,
                from,
                created_time,
                comment_count`,
                limit: 100,
                filter: 'toplevel', // ← only top-level comments, replies nested inside

            },
        }
    );

    allComments = data.data || [];

    res.json({ values: allComments });
});

const getComments = expressAsyncHandler(async (req, res, next) => {
    const { pageId, id, sort = 'old', after, before, filter } = req.query;
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages?.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    const order = sort === 'old' ? 'chronological' : 'reverse_chronological'

    const { data } = await axiosInstance.get(
        `${BASE_URL}/${id}/comments`,
        {
            params: {
                access_token: page.access_token,
                fields: 'id,message,is_hidden,from,created_time,parent,comment_count,like_count,attachment',
                limit: 100,
                filter: 'toplevel', // ← only top-level comments, replies nested inside
                order,
                ...(after && {
                    after
                }),
                ...(before && {
                    before
                }),
            },
        }
    );
    let comments = data.data
    const paging = {}
    paging.after = data?.paging?.next && data?.paging.cursors?.after
    paging.before = data?.paging?.previous && data?.paging.cursors?.before

    if (filter === '0') {
        comments = comments.filter(comment => comment.comment_count === 0)
    } else if (filter === '1') {
        comments = comments.filter(comment => comment.comment_count)
    }

    res.json({ status: SUCCESS, values: { comments, paging } })
})

const updateComment = expressAsyncHandler(async (req, res, next) => {
    const { message, id, pageId, is_hidden = undefined } = req.body
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages?.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    const { data } = await axiosInstance.post(
        `https://graph.facebook.com/v25.0/${id}`,
        null,
        {
            params: {
                ...(message && { message }),
                ...(is_hidden !== undefined && { is_hidden }),
                access_token: page.access_token,
            },
        }
    );

    res.json({ success: SUCCESS, values: data.id, message: 'تم تعديل التعليق بنجاح' });
})

const createComment = expressAsyncHandler(async (req, res, next) => {
    const { message, id, pageId } = req.body
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages?.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    if (!req.file && !message)
        return res
            .status(404)
            .json({ message: "file and message are required" });
    const attachmentId = req.file ? await uploadPhotoUnpublished(req.file, page.id, page.access_token) : null

    const result = await axiosInstance.post(
        `${BASE_URL}/${id}/comments`,
        {
            message,
            ...(attachmentId && {
                attachment_id: attachmentId
            }),
            access_token: page.access_token,
        }
    );

    res.json({ success: SUCCESS, values: result.data.id, message: 'تم ارسال التعليق بنجاح' });
})

const deleteComment = expressAsyncHandler(async (req, res, next) => {
    const { id, pageId } = req.body
    const facebookSocial = await SocialModel.findOne({ type: SocialConstants.FACEBOOK })

    const page = facebookSocial.pages?.find(p => p.id === pageId);
    if (!page) return res.status(404).json({ message: 'Page not found', status: FAILED });

    const { data } = await axiosInstance.delete(
        `https://graph.facebook.com/v25.0/${id}`,
        {
            params: {
                access_token: page.access_token,
            },
        }
    );

    res.json({ success: SUCCESS, values: data.id, message: 'تم ازاله التعليق بنجاح' });
})
//(Modify) Posts created - comments created - update Post - update Comment - delete Post - delete Comment
// Add Comments pagination - sorting - filtering
module.exports = {
    loginToFacebook, facebookCallbackLogin, facebookDelete,
    getPages, getPosts, createPost, updatePost, deletePost,
    getPostComments, getComments, createComment, updateComment, deleteComment
}
