import GradeModel from '../models/GradeModel.js';
import { getAll, insertOne, updateOne, deleteOne, getOne } from './factoryHandler.js';

const gradeParams = (query) => {
    return [
        { key: "name", value: query.name },
        { key: "description", value: query.description },
        { key: "index", value: query.index },
        { key: "isActive", value: query.isActive },
        { key: "order", value: query.order },

    ]
}

const relatedFiles = ['image']
const getGrades = getAll(GradeModel, 'grades', gradeParams)
const getOneGrade = getOne(GradeModel)

const createGrade = insertOne(GradeModel, true)
const updateGrade = updateOne(GradeModel)

const deleteGrade = deleteOne(GradeModel, [], [], relatedFiles)

export { getGrades, getOneGrade, createGrade, updateGrade, deleteGrade };