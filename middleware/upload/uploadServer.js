const path = require('path');
const fs = require('fs');
const filePlayers = require('../../tools/constants/filePlayers');
const dotenv = require("dotenv");
const sharp = require('sharp');
const makeRandom = require('../../tools/makeRandom');

//config
dotenv.config()

const addToServer = (file, settings = { secure: true, name: "unknown" }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileName = decodeURIComponent(settings.name)
            const resource_type = file.mimetype; // e.g., 'video/mp4'
            const isImage = file.mimetype.startsWith('image')

            let filePath = `storage/${settings.secure ? 'secure' : 'public'}/${fileName}-${Date.now()}-${makeRandom(0, 9, 4)}${isImage ? '.webp' : path.extname(file.originalname)}`
            // const fileStoragePath = path.join(__dirname, '../../../storage/' + settings.secure ? 'secure' : 'public');
            const fileStoragePath = path.join(__dirname, '../../storage/', settings.secure ? 'secure' : 'public');

            // console.log(fileStoragePath)
            if (!fs.existsSync(fileStoragePath)) {
                fs.mkdirSync(fileStoragePath, { recursive: true });
            }
            // Save the file to the server

            const url = process.env.http + '/' + filePath
            const player = filePlayers.SERVER

            // Create read and write streams
            if (isImage) {
                await sharp(file.path)
                    // .resize({ width: 800 }) // Resize the image (optional)
                    .webp({ quality: 80 })  // Convert to WebP and set quality
                    .toFile(filePath);
                return resolve({ url, resource_type, player, name: fileName })
            }

            const readStream = fs.createReadStream(file.path);
            const writeStream = fs.createWriteStream(filePath);

            // Pipe the read stream into the write stream
            readStream.pipe(writeStream);

            // Resolve promise on successful finish
            writeStream.on('finish', () => {
                resolve({ resource_type, url, player, name: fileName });
            });

            // Handle errors
            readStream.on('error', reject);
            writeStream.on('error', reject);
        } catch (error) {
            reject(error)
        }
    })
}

const deleteFromServer = (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            const parsedUrl = new URL(file.url);
            const pathSegments = parsedUrl.pathname.split('/');

            const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1])
            const isSecure = pathSegments.includes('secure')

            const filePath = path.join(__dirname, '../../storage', isSecure ? 'secure' : 'public', fileName); // Construct the file path

            // Delete the file
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    // File exists, delete it
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            return resolve(false)
                        } else {
                            return resolve(true)
                        }
                    });
                } else {
                    return resolve(false)
                }
            });
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { addToServer, deleteFromServer }
