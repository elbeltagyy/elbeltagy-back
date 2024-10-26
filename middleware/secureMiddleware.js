const asyncHandler = require("express-async-handler")
const { user_roles } = require("../tools/constants/rolesConstants")

const secureGetAll = () => asyncHandler(async (req, res, next) => {
    const user = req.user

    if (user.role === user_roles.STUDENT || user.role === user_roles.ONLINE) {
        req.query.user = user._id
    }
    next()
})

module.exports = { secureGetAll }