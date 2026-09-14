const asyncHandler = require("express-async-handler")
const { user_roles } = require("../tools/constants/rolesConstants")

//roles to secure and others skip
//By roles
const secureGetAll = (params = null, skip = []) => asyncHandler(async (req, res, next) => {
    const user = req.user

    if ([...skip, user_roles.ADMIN, user_roles.SUBADMIN].includes(user.role)) return next()

    const queries = typeof params === "function"
        ? params(user, req) || []
        : params;

    if (queries) {
        if (Array.isArray(queries)) {
            queries.forEach(query => {
                req.query[query.key] = query.value
            });
        } else {
            let query = queries
            req.query[query.key] = query.value
        }
        return next()
    }
    req.query.user = user._id
    next()
})


module.exports = { secureGetAll }