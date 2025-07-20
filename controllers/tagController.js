const expressAsyncHandler = require("express-async-handler");
const QuestionModel = require("../models/QuestionModel");
const TagModel = require("../models/TagModel");
const { getAll, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const { SUCCESS } = require("../tools/statusTexts");
const { default: mongoose } = require("mongoose");


const tagParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "_id", value: query._id, operator: 'equal' },
        { key: "grade", value: query.grade, operator: 'equal' },
        { key: "isActive", value: query.isActive, type: 'boolean' },
        { key: "createdAt", value: query.createdAt },
    ]
}

const addTagQsCount = async (req, values) => {
    try {
        const userId = req.user._id
        if (req.query.counting) {
            values.tags = await Promise.all(
                values.tags.map(async (tag) => {
                    // const count = await QuestionModel.countDocuments({
                    //     tags: tag._id, isActive: true
                    // });
                    // return { ...tag, count }
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
    linkTag, unLinkTag, tagParams
}