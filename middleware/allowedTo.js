const createError = require("../tools/createError")
const { user_roles } = require("../tools/constants/rolesConstants")
const { FAILED } = require("../tools/statusTexts")


const allowedTo = (...roles) => {

    return (req, res, next) => {

        const currentUser = req.user

        if (!roles.includes(currentUser.role)) {
            const authError = createError("you are not authed", 401, FAILED)
            return next(authError)
        }
        next()
    }

}

module.exports = allowedTo