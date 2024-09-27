const UnitModel = require("../models/UnitModel");
const { getAll, getOne, insertOne, updateOne, deleteOne } = require("./factoryHandler");


const unitParams = (query) => {
    return [
        { key: "grade", value: query.grade, operator: "equal" },
        { key: "name", value: query.name },
    ]
}



const getUnits = getAll(UnitModel, 'units', unitParams)
const getOneUnit = getOne(UnitModel)

const createUnit = insertOne(UnitModel)
const updateUnit = updateOne(UnitModel)

const deleteUnit = deleteOne(UnitModel)

module.exports = { getUnits, getOneUnit, createUnit, updateUnit, deleteUnit, unitParams }