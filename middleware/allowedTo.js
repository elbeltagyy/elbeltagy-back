import createError from '../tools/createError.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import { FAILED } from '../tools/statusTexts.js';


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

export default allowedTo;