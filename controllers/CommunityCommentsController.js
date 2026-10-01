import { getAll, deleteOne, updateOne, getDocCount, insertOne } from './factoryHandler.js';

import CommunityCommentModel from '../models/CommunityCommentModel.js';
import expressAsyncHandler from 'express-async-handler';
import { user_roles } from '../tools/constants/rolesConstants.js';
import CommunityQuestionModel from '../models/CommunityQuestionModel.js';
import createError from '../tools/createError.js';
import { FAILED } from '../tools/statusTexts.js';

const communityParams = (query) => {
    return [
        { key: "user", value: query.user },
        { key: "question", value: query.question },
        { key: "courses", value: query.courses },
        { key: "lectures", value: query.lectures },

        { key: "status", value: query.status },
        { key: "isActive", value: query.isActive },
        { key: "content", value: query.content },
        { key: "likes", value: query.likes },
    ]
}
const allowedToSkip = [user_roles.ADMIN, user_roles.SUBADMIN]


const protectGetComments = expressAsyncHandler(async (req, res, next) => {
    const user = req.user

    //Users
    if (!allowedToSkip.includes(user.role)) {
        req.query.isActive = true
        if (req.query.populate) {
            req.query.populate = 'user.name user.role'
        }
    }

    next()
})

const handleGetComments = (req, values) => {
    //Likes
    const user = req.user

    const count = values.count
    const data = values.communityComments

    return {
        count, communityComments: data.map(d => {
            return {
                ...d,
                isLiked: d.likes?.some(
                    id => id.toString() === user._id.toString()
                ),
                likes: d.likes?.length
            }
        })
    }
}

const onCreateComment = async (req, values) => {
    const user = req.user;
    const question = values.question;
    const commentId = values._id

    const isAdmin = [
        user_roles.ADMIN,
        user_roles.SUBADMIN
    ].includes(user.role);

    const communityQuestion = await CommunityQuestionModel.findById(question);

    if (!communityQuestion) {
        return createError('هذا السؤال غير موجود', 404, FAILED);
    }

    if ((communityQuestion.firstAuthorReplay?.length ?? 0) < 1 && isAdmin) {
        communityQuestion.status = "published";
        communityQuestion.firstAuthorReplay = [commentId]
    }
    communityQuestion.replies += 1;
    await communityQuestion.save();
}

const onDeleteComment = async (req, values) => {
    const question = values.question
    await CommunityQuestionModel.updateOne(
        { _id: question },
        { $inc: { replies: -1 } }
    );
}

const getCommunityComments = getAll(CommunityCommentModel, 'communityComments', communityParams, true, null, handleGetComments)
const getCommunityCommentsCount = getDocCount(CommunityCommentModel, communityParams)

const createCommunityComment = insertOne(CommunityCommentModel, true, null, null, onCreateComment)
const updateCommunityComment = updateOne(CommunityCommentModel)
const deleteCommunityComment = deleteOne(CommunityCommentModel, null, null, null, onDeleteComment)

const checkUserCanPerformAction = expressAsyncHandler(async (req, res, next) => {
    const user = req.user

    if (allowedToSkip.includes(user.role)) return next()

    const questionId = req.params.id
    const userId = req.user._id
    const isOwner = await CommunityCommentModel.findOne({ user: userId, _id: questionId }).select('_id').lean()
    if (!isOwner) {
        throw createError('لا يمكن حذف هذا السؤال', 400, FAILED)
    }
    next()
})

const addLikeToComment = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const commentId = req.params.id
    const dislike = req.body.dislike

    await CommunityCommentModel.updateOne(
        { _id: commentId },
        dislike
            ? { $pull: { likes: user._id } }
            : { $addToSet: { likes: user._id } }
    );
    res.status(204).json({})
})


export {
    getCommunityComments, getCommunityCommentsCount, addLikeToComment, protectGetComments,
    createCommunityComment, updateCommunityComment, deleteCommunityComment, checkUserCanPerformAction
};