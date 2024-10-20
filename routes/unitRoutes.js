const { getUnits, createUnit, getOneUnit, updateUnit, deleteUnit, checkUnitsBeforeDelete } = require("../controllers/unitController")

const router = require("express").Router()

router.route("/")
    .get(getUnits)
    .post(createUnit)

router.route("/:id")
    .get(getOneUnit)
    .put(updateUnit)
    .delete(checkUnitsBeforeDelete, deleteUnit)

module.exports = router
