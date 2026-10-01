import express from 'express';
const router = express.Router();
import dotenv from 'dotenv';

import expressAsyncHandler from 'express-async-handler';
import { addToVimeo } from '../middleware/upload/cloudinary.js';
import { upload } from '../middleware/storage.js';
import UserModel from '../models/UserModel.js';
import UAParser from 'ua-parser-js';
import verifyToken from '../middleware/verifyToken.js';
import allowedTo from '../middleware/allowedTo.js';
import { user_roles } from '../tools/constants/rolesConstants.js';
import createError from '../tools/createError.js';
import { FAILED } from '../tools/statusTexts.js';
import axios from 'axios';

dotenv.config()

router.use(expressAsyncHandler(async (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        next()
    } else {
        next(createError('Not Found Page', 404, FAILED))
    }

}))

router.post("/", upload.single('file'), expressAsyncHandler(async (req, res, next) => {
    const file = req.file

    const video = await addToVimeo(file)

    res.json(video)
}))
const BASE = 'https://graph.facebook.com/v25.0';
const token = 'EAAe7C5zLcc0BRuyo3xqN80LC1gwiK9uEf43ZC3b3TUkhtX6K0ZBXqMwNEhHsBy2eNBBU8doHpnd5jDFWmgXc5oHiFZCQUdFHU0paxrRBvTkuqKetZABtuc2ZADbtIcDBnZC28mDYVF5mhfjZCZCt4HeoFiJucNzeVKo7idvEbK3sYIPrOAKjwoRrNogFy4ZBLJBkmDt2UJpeEMso7uJqcNikBG9zN3NVwTUQOFSaelncZD'
//Basic => oAuth - Posts - Comments Approach - Auto Reply By Ai

router.get('/facebook/posts', async (req, res, next) => {

    const postsFetch = await axios.get(`${BASE}/968823226321372/posts`, {
        params: {
            fields: 'id,message,created_time,likes.summary(true),attachments{media,type,subattachments}',
            access_token: token,
            limit: 25
        }
    });
    const posts = postsFetch.data
    res.json({ msg: 'done', posts })
})

router.get('/facebook/posts/:id', async (req, res, next) => {
    const postId = req.params.id

    const BASE = 'https://graph.facebook.com/v25.0';
    const postsFetch = await axios.get(
        `${BASE}/${postId}/comments`,
        {
            params: {
                fields: 'id,message,created_time,likes.summary(true),attachments{media,type,subattachments},comments.summary(true){id,message,from,created_time}',
                filter: 'stream',
                access_token: token,
                limit: 1
            }
        }
    );
    const posts = postsFetch.data
    res.json({ msg: 'done', posts })
})

router.get('/facebook/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const message = 'Hello world'

    try {
        const response = await axios.post(
            `${BASE}/${commentId}/comments`,
            { message },
            { params: { access_token: token } }
        );

        res.json({ success: true, id: response.data.id, data: response.data });
    } catch (err) {
        res.status(400).json({ error: err.response?.data });
    }
});


//WHatsapp Automation

const whatsappToken = "EAAYJ76yZAUQgBRlfV6iPUZARyAZCPDMV7vU53SZBNqCwP3xhZBPmqVqOJLXk5KkhyinP7vdpDSYAB5yay7b430FVTfl29lJ2l0ctDOUZB33ZBgWG7fnq0pJVNybxGw3ZBOy8bvMpZB5ZCX12RAhkVa6G84t9UPAMMbgEYdACsT8lC0waeZABAZCssX0jhI2n4dBpK6UjLjxvWLMxdgZBbmudGxTr6GYWltZAqKp3e0fWXHbUXuS3R5ZA4HdhyvEiIVsj3Y0w0CoI9blZCS8LZAZBR2ASaN5LSVakEg"
const Whatsapp_Business_Id = '972583982048548'
const Phone_Id = '1119190827948281'
const verify_token = 'test'

router.get('/whatsapp/webhook', (req, res) => {
    // console.log('hello world')
    if (req.query['hub.verify_token'] === verify_token) {
        return res.send(req.query['hub.challenge']); // ✅ Verified
    } else {
        return res.sendStatus(403);
    }
});

// Receive incoming messages
router.post('/whatsapp/webhook', (req, res) => {
    const body = req.body;
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;

    if (messages) {
        const msg = messages[0];
        const from = msg.from;       // sender's phone number
        const text = msg.text?.body; // message content
        console.log(`New message from ${from}: ${text}`);

        // → Save to your DB, trigger AI reply, etc.
    }
    return res.sendStatus(200);
});

//Sending Msgs
router.get('/whatsapp/send', async (req, res, next) => {
    const response = await axios.post(
        `https://graph.facebook.com/v25.0/${Phone_Id}/messages`,
        {
            messaging_product: 'whatsapp',
            to: '+201094799114',           // e.g. "+201234567890"
            type: 'text',
            text: { body: 'Hello world from test demooo' }
        },
        {
            headers: {
                'Authorization': `Bearer ${whatsappToken}`,
                'Content-Type': 'application/json',
            }
        });
    const data = response.data
    res.json({ msg: 'msg sent', data: data });
})

router.get("/", verifyToken(true), async (req, res, next) => {
    try {
        // Get the user-agent string from the request headers
        const userAgent = req.headers['user-agent'];

        // Parse the user-agent string
        const parser = new UAParser();
        const result = parser.setUA(userAgent).getResult();

        return res.json({ device: result, userAgent })
        const users = await UserModel.find({})
        const count = await UserModel.countDocuments({})
        res.json({ msg: "done", values: { users, count } })
    } catch (error) {
        console.log('error')
        const err = new Error()
        err.message = 'Failed'
        next(err)
    }
})
export default router;