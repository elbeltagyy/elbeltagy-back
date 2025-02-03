const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    // puppeteer: {
    //     headless: false
    // },
    authStrategy: new LocalAuth({
        clientId: 'test_client_id',
    })
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// client.on('ready', () => {
//     console.log('Client is ready!');
// });

// Listening to all incoming messages
// client.on('message_create', async (message) => {
//     // const contact = await message.getContact()
//     // console.log(message.from, 'from ++++')
//     console.log(message.body);
// });

// not used
// client.on('message', async (msg) => {
//     try {
//         // if (msg.from != 'status@broadcast') {
//         // }
//     } catch (error) {
//         console.log('has error ==>', error)
//     }
// });

module.exports = client