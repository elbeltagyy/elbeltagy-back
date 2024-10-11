const path = require('path');
const fs = require('fs');
const videoPlayers = require('../tools/constants/videoPlayers');
const dotenv = require("dotenv")

//config
dotenv.config()

const addToServer = (file, settings) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileName = settings.name
            const resource_type = file.mimetype; // e.g., 'video/mp4'
            const fileType = resource_type.split('/')[0]
            let filePath = ''

            if (fileType === 'image') {
                filePath = `storage/secure/images/${fileName || file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
            } else if (fileType === 'video') {
                filePath = `storage/secure/videos/${fileName || file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
            } else {
                filePath = `storage/secure/pdf/${fileName || file.originalname}-${Date.now()}${path.extname(file.originalname)}`;
            }

            const videoStoragePath = path.join(__dirname, '../storage/secure/videos');
            const imageStoragePath = path.join(__dirname, '../storage/secure/images');
            const fileStoragePath = path.join(__dirname, '../storage/secure/pdf');


            if (!fs.existsSync(videoStoragePath)) {
                fs.mkdirSync(videoStoragePath, { recursive: true });
            }

            if (!fs.existsSync(imageStoragePath)) {
                fs.mkdirSync(imageStoragePath, { recursive: true });
            }

            if (!fs.existsSync(fileStoragePath)) {
                fs.mkdirSync(fileStoragePath, { recursive: true });
            }
            // Save the file to the server

            const size = file.size; // Size in bytes
            const url = process.env.host === 'local' ?
                'http://localhost:' + process.env.PORT + '/' + filePath
                : process.env.host + '/' + filePath
            const player = videoPlayers.SERVER
            fs.writeFile(filePath, file.path, (err) => {
                if (err) {
                    return reject(err)
                }
                const file = { resource_type, size, url, player }
                return resolve(file)
            });

        } catch (error) {
            reject(error)
        }
    })
}


module.exports = { addToServer }
