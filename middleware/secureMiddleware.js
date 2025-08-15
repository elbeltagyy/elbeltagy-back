const asyncHandler = require("express-async-handler")
const { user_roles } = require("../tools/constants/rolesConstants")

const secureGetAll = (query = null) => asyncHandler(async (req, res, next) => {
    const user = req.user

    if (query) {
        //handel query if arr *_*
        req.query[query.key] = query.value
        return next()
    }


    if (user.role === user_roles.STUDENT || user.role === user_roles.ONLINE) {
        req.query.user = user._id
    }
    next()
})


module.exports = { secureGetAll }