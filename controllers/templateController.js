import { getAll, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import TemplateModel from '../models/TemplateModel.js';
import expressAsyncHandler from 'express-async-handler';

const params = (query) => [
    { key: "question", value: query.question },
    { key: "answer", value: query.answer },
]


const getTemplates = getAll(TemplateModel, 'templates', params)
const createTemplate = insertOne(TemplateModel, true)

const incrementUses = expressAsyncHandler(async (req, res, next) => {
    const id = req.params.id
    await TemplateModel.findByIdAndUpdate(id, { $inc: { uses: 1 } })
    res.status(200).json({})
})
const updateTemplate = updateOne(TemplateModel)
const deleteTemplate = deleteOne(TemplateModel)

export { getTemplates, createTemplate, updateTemplate, deleteTemplate, incrementUses };