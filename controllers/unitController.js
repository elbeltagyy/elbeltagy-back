const expressAsyncHandler = require("express-async-handler");
const UnitModel = require("../models/UnitModel");
const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");
const CourseModel = require("../models/CourseModel");
const createError = require("../tools/createError");
const { FAILED } = require("../tools/statusTexts");


const unitParams = (query) => {

    return [
        { key: "grade", value: Number(query.grade), type: "number" },
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

module.exports = { getUnits, getOneUnit, createUnit, updateUnit, checkUnitsBeforeDelete, deleteUnit, unitParams }