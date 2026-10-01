import expressAsyncHandler from 'express-async-handler';
import UnitModel from '../models/UnitModel.js';
import { getAll, getOne, insertOne, updateOne, deleteOne } from './factoryHandler.js';
import CourseModel from '../models/CourseModel.js';
import createError from '../tools/createError.js';
import { FAILED } from '../tools/statusTexts.js';


const unitParams = (query) => {

    return [
        { key: "grade", value: query.grade },
        { key: "name", value: query.name },
    ]
}



const getUnits = getAll(UnitModel, 'units', unitParams, false)
const getOneUnit = getOne(UnitModel)

const createUnit = insertOne(UnitModel)
const updateUnit = updateOne(UnitModel)

const deleteUnit = deleteOne(UnitModel)

const checkUnitsBeforeDelete = expressAsyncHandler(async (req, res, next) => {
    const unitId = req.params.id
    const foundCourse = await CourseModel.findOne({ unit: unitId })
    if (foundCourse) return next(createError("هناك كورسات فى هذه الوحده , يجب حذف جميع الكورسات", 400, FAILED))
    next()
})

export { getUnits, getOneUnit, createUnit, updateUnit, checkUnitsBeforeDelete, deleteUnit, unitParams };