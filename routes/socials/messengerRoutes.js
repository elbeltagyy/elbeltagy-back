import { getConversations, getMessages, replyToMessage } from '../../controllers/social/messengerController.js';
import allowedTo from '../../middleware/allowedTo.js';
import { upload } from '../../middleware/storage.js';
import verifyToken from '../../middleware/verifyToken.js';
import { user_roles } from '../../tools/constants/rolesConstants.js';
import axiosInstance from '../../tools/fcs/axios.js';

import express from 'express';
const router = express.Router();

export const subscribeMessenger = async ({ pageId, accessToken }) => {

    const { data } = await axiosInstance.post(
        `https://graph.facebook.com/v25.0/${pageId}/subscribed_apps`,
        {
            subscribed_fields: ['messages', 'messaging_postbacks', 'message_deliveries'],
        },
        {
            params: {
                access_token: accessToken,
            }
        }
    );
    console.log('subscritpion ==>', data);
}

router.route('/conversations')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getConversations)

router.route('/conversations/:id')
    .get(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), getMessages)
    .post(verifyToken(), allowedTo(user_roles.ADMIN, user_roles.SUBADMIN), upload.array('files', 10), replyToMessage)

// GET /webhook — Meta calls this to verify your endpoint
router.route('/webhook').get((req, res) => {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;

    if (mode === 'subscribe' && token === 'test') {
        res.status(200).send(challenge); // confirm ownership
    } else {
        res.sendStatus(403);
    }
});

// POST /webhook — Meta sends all events here
router.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            entry.messaging.forEach(event => console.log('event ==>', event));
        });
    }
    res.sendStatus(200); // always respond fast!
});

export default router;