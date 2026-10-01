import { getAll, deleteOne, updateOne, getDocCount, insertOne, deleteMany } from './factoryHandler.js';

import CommunityQuestionModel from '../models/CommunityQuestionModel.js';
import CommunityCommentModel from '../models/CommunityCommentModel.js';
import expressAsyncHandler from 'express-async-handler';
import createError from '../tools/createError.js';
import { FAILED } from '../tools/statusTexts.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import UserModel from '../models/UserModel.js';

const communityParams = (query) => {
    return [
        { $filter: query.$filter },
        { key: "user", value: query.user },
        { key: "_id", value: query._id },
        { key: "courses", value: query.courses },
        { key: "lectures", value: query.lectures },

        { key: "status", value: query.status },
        { key: "isActive", value: query.isActive },
        { key: "content", value: query.content },
        { key: "likes", value: query.likes },
        { key: "replies", value: query.replies },
        { key: "firstAuthorReplay", value: query.firstAuthorReplay },
        // { key: "comments", value: query.comments },
    ]
}

const allowedToSkip = [user_roles.ADMIN, user_roles.SUBADMIN]


const dependantModels = [
    { model: CommunityCommentModel, field: 'question' },
]

const appendPendingOnCreateToUser = expressAsyncHandler(async (req, res, next) => {
    const user = req.user

    if (allowedToSkip.includes(user.role)) {
        req.body.status = 'published'
    } else {
        req.body.status = 'pending'
    }

    next()
})

const getOnlyApprovedForUser = expressAsyncHandler(async (req, res, next) => {
    const user = req.user

    //Users
    if (!allowedToSkip.includes(user.role)) {
        req.query.isActive = true
        if (req.query.populate) {
            req.query.populate = 'firstAuthorReplay user.name user.role courses.name'
        }
        if (req.query.status === 'all') {
            req.query.$filter = {
                $or: [{
                    status: 'published',
                    isActive: true
                }, {
                    status: 'pending',
                    user: user._id,
                    isActive: true
                }]
            }
        } else if (req.query.status === 'pending') {
            req.query.user = user._id
        } else {
            req.query.status = 'published'
        }
    }

    next()
})
const handleGetQuestions = (req, values) => {
    const user = req.user

    const count = values.count
    const data = values.communityQuestions

    return {
        count, communityQuestions: data.map(d => {
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
const relatedFiles = ['attachments']

const getCommunityQuestions = getAll(CommunityQuestionModel, 'communityQuestions', communityParams, true, null, handleGetQuestions)
const getCommunityQuestionsCount = getDocCount(CommunityQuestionModel, communityParams)

const createCommunityQuestion = insertOne(CommunityQuestionModel, true,)
const updateCommunityQUestion = updateOne(CommunityQuestionModel)
const deleteCommunityQuestion = deleteOne(CommunityQuestionModel, [], dependantModels, relatedFiles)
const deleteManyCommunityQuestions = deleteMany(CommunityQuestionModel, communityParams, [], dependantModels, relatedFiles)

const checkUserCanPerformAction = expressAsyncHandler(async (req, res, next) => {
    const user = req.user

    if (allowedToSkip.includes(user.role)) return next()

    const questionId = req.params.id
    const userId = req.user._id
    const isOwner = await CommunityQuestionModel.findOne({ user: userId, _id: questionId }).select('_id').lean()
    if (!isOwner) {
        throw createError('لا يمكن حذف هذا السؤال', 400, FAILED)
    }
    next()
})

const addLikeToQuestion = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const questionId = req.params.id
    const dislike = req.body.dislike

    await CommunityQuestionModel.updateOne(
        { _id: questionId },
        dislike
            ? { $pull: { likes: user._id } }
            : { $addToSet: { likes: user._id } }
    );
    res.status(204).json()
})

export {
    appendPendingOnCreateToUser, getOnlyApprovedForUser,
    getCommunityQuestions, getCommunityQuestionsCount,
    createCommunityQuestion, updateCommunityQUestion, addLikeToQuestion,
    deleteCommunityQuestion, deleteManyCommunityQuestions, checkUserCanPerformAction
};