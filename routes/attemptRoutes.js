const { getAttempts, getOneAttempt } = require("../controllers/attemptController")
const { filterById } = require("../controllers/factoryHandler")
const { userParams } = require("../controllers/userController")
const UserModel = require("../models/UserModel")

const router = require("express").Router()

router.route("/")
    .get(filterById(UserModel, userParams, 'user'), getAttempts)

router.route("/:id")
    .get(getOneAttempt)
module.exports = router