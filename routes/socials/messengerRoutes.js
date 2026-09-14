const { getConversations, getMessages, replyToMessage } = require("../../controllers/social/messengerController");
const { upload } = require("../../middleware/storage");
const axiosInstance = require("../../tools/fcs/axios");

const router = require("express").Router()
const subscribeMessenger = async ({ pageId, accessToken }) => {

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
    .get(getConversations)

router.route('/conversations/:id')
    .get(getMessages)
    .post(upload.array('files', 10), replyToMessage)

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

router.subscribeMessenger = subscribeMessenger
module.exports = router