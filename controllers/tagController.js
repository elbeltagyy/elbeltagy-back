const expressAsyncHandler = require("express-async-handler");
const QuestionModel = require("../models/QuestionModel");
const TagModel = require("../models/TagModel");
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const { SUCCESS, FAILED } = require("../tools/statusTexts");
const { default: mongoose } = require("mongoose");
const createError = require("../tools/createError");


const tagParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "number", value: query.number },
        { key: "isFree", value: query.isFree },
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "grade", value: query.grade, operator: 'equal' },
        { key: "isActive", value: query.isActive, type: 'boolean' },
        { key: "createdAt", value: query.createdAt },
    ]
}

const addTagQsCount = async (req, values) => {
    try {
        const user = req.user
        const userId = req.user._id

        values.tags.forEach(tag => {
            tag.access = false
            if (user.tags?.includes(tag._id) || tag.isFree) {
                tag.access = true
            }
            return tag
        });

        if (req.query.counting) {
            values.tags = await Promise.all(
                values.tags.map(async (tag) => {
                    // if (!tag.access) {
                    //     const count = await QuestionModel.countDocuments({
                    //         tags: tag._id, isActive: true
                    //     });
                    //     return { ...tag, count }
                    // }
                    const tagId = new mongoose.Types.ObjectId(tag._id);
                    const userObjId = new mongoose.Types.ObjectId(userId);

                    const result = await QuestionModel.aggregate([
                        {
                            $match: {
                                tags: tagId,
                                isActive: true
                            }
                        },
                        {
                            $facet: {
                                totalCount: [{ $count: 'count' }],
                                unansweredCount: [
                                    {
                                        $lookup: {
                                            from: 'answers',
                                            let: { questionId: '$_id' },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $and: [
                                                                { $eq: ['$question', '$$questionId'] },
                                                                { $eq: ['$user', userObjId] }
                                                            ]
                                                        }
                                                    }
                                                }
                                            ],
                                            as: 'userAnswers'
                                        }
                                    },
                                    {
                                        $match: {
                                            userAnswers: { $size: 0 }
                                        }
                                    },
                                    { $count: 'count' }
                                ]
                            }
                        }
                    ]);

                    const totalCount = result[0]?.totalCount[0]?.count || 0;
                    const unansweredCount = result[0]?.unansweredCount[0]?.count || 0;

                    return {
                        ...tag,
                        count: totalCount,
                        unansweredCount
                    };
                })
            );
        }
        return values
    } catch (error) {
        console.log('error from add tags', error)
        return values
    }
}

const validateUserTag = expressAsyncHandler(async (req, res, next) => {
    const user = req.user
    const tagsIds = req.body.tags // [_ids]

    if (!tagsIds || tagsIds.length < 1) {
        return next(createError('لا يوجد دروس', 404, FAILED))
    }

    // Convert to strings for comparison
    const userTagSet = new Set(user.tags.map(t => t.toString()))

    // Get missing tags (those not in user.tags)
    const missingTagIds = tagsIds.filter(tagId => !userTagSet.has(tagId.toString()))

    if (missingTagIds.length === 0) {
        // User already has all tags
        return next()
    }

    // Fetch only missing tags
    const missingTags = await TagModel.find({ _id: { $in: missingTagIds } })
        .lean()
        .select('isFree')

    // Check if any missing tag is not free
    const hasRestricted = missingTags.some(tag => !tag.isFree)

    if (hasRestricted) {
        return next(createError('هذا الدرس غير متاح لك', 400, FAILED))
    }

    return next()
})


const getTags = getAll(TagModel, 'tags', tagParams, true, '', addTagQsCount)
const createTag = insertOne(TagModel)

const updateTag = updateOne(TagModel)
const deleteTag = deleteOne(TagModel, [{ model: QuestionModel, fields: ['tags'] }])

//=============linking ====#
// @desc add tag to many Questions
// @route POST /tags/:id/questions
// @access Private
const linkTag = expressAsyncHandler(async (req, res, next) => {
    const tag = req.params.id
    const questions = req.body.questions

    await QuestionModel.updateMany({ _id: { $in: questions } }, { $addToSet: { tags: tag } })
    res.status(200).json({ message: 'تم ايضافه الروابط بنجاح', status: SUCCESS })
})

// @desc delete tag from many Questions
// @route DELETE /tags/:id/questions
// @access Private
const unLinkTag = expressAsyncHandler(async (req, res, next) => {
    const tag = req.params.id
    const questions = req.body.questions

    await QuestionModel.updateOne(
        { _id: { $in: questions }, tags: tag },
        { $pull: { tags: tag } }
    );
    res.status(200).json({ message: 'تم ازاله الروابط بنجاح', status: SUCCESS })
})

module.exports = {
    getTags, createTag, updateTag, deleteTag,
    linkTag, unLinkTag, tagParams,

    validateUserTag
}