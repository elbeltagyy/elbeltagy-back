const { getUnits, createUnit, getOneUnit, updateUnit, deleteUnit } = require("../controllers/unitController")

const router = require("express").Router()

router.route("/")
    .get(getUnits)
    .post(createUnit)

router.route("/:id")
    .get(getOneUnit)
    .put(updateUnit)
    .delete(deleteUnit)

module.exports = router
