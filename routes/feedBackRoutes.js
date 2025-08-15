const { filterById } = require('../controllers/factoryHandler')
const { getFeedBacks, createFeedBack, getOneFeedBack, deleteFeedBack } = require('../controllers/feedBackController')
const allowedTo = require('../middleware/allowedTo')
const { secureGetAll } = require('../middleware/secureMiddleware')
const verifyToken = require('../middleware/verifyToken')
const UserModel = require('../models/UserModel')
const { user_roles } = require('../tools/constants/rolesConstants')

const router = require('express').Router()

const params = (query) => {
    return [
        { key: 'name', value: query.name },
        { key: 'userName', value: query.userName },
    ]
}
router.route("/")
    .get(verifyToken(), secureGetAll(), filterById(UserModel, params, 'user'), getFeedBacks)
    .post(verifyToken(), createFeedBack)

router.route("/:id")
    .put(verifyToken(), getOneFeedBack)
    .delete(verifyToken(), deleteFeedBack)
module.exports = router

