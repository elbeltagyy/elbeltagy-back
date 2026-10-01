import { filterById } from '../controllers/factoryHandler.js';
import { getFeedBacks, createFeedBack, getOneFeedBack, deleteFeedBack } from '../controllers/feedBackController.js';
import allowedTo from '../middleware/allowedTo.js';
import { secureGetAll } from '../middleware/secureMiddleware.js';
import verifyToken from '../middleware/verifyToken.js';
import UserModel from '../models/UserModel.js';
import { user_roles } from '../tools/constants/rolesConstants.js';

import express from 'express';
const router = express.Router();

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
export default router;

