const { userParams } = require("../../controllers/userController")
const { user_roles } = require("../constants/rolesConstants")
const parseFilters = require("./matchGPT")


const selectUsers = (body) => {

    const isExcluded = body.isExcluded
    const excludedUsers = body.excludedUsers || []

    let match = parseFilters(userParams({ ...body, courses: body.course }))
    match.role = { $in: [user_roles.STUDENT, user_roles.ONLINE] }

    if (excludedUsers?.length > 0 && isExcluded) {
        match = { ...match, _id: { $nin: excludedUsers } }
    }

    if (!isExcluded) {
        match = { _id: { $in: excludedUsers } } //...match,
    }
    return match

}

module.exports = selectUsers