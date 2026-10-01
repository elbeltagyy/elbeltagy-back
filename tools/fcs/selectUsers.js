import { userParams } from '../../controllers/userController.js';
import { user_roles } from '../constants/rolesConstants.js';
import createError from '../createError.js';
import parseFilters from './matchGPT.js';


const selectUsers = (body) => {

    if (body.user) {
        return { _id: body.user }
    }

    const isExcluded = body.isExcluded
    const excludedUsers = body.excludedUsers || []

    const users = [...new Set([...excludedUsers, ...(body.users || [])])]

    if (isExcluded) { //users?.length > 0 && 
        match = parseFilters(userParams({ ...body, courses: body.course })) //
        match.role = { $in: [user_roles.STUDENT, user_roles.ONLINE] }
        match = { ...match, _id: { $nin: users } }
        return match
    }

    if (!isExcluded && users?.length) {
        return { _id: { $in: users } }
    }
    throw createError('Sorry, the data given to be sent is incorrect', 400)
}

export default selectUsers;