import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import filePlayers from '../../tools/constants/filePlayers.js';
import dotenv from 'dotenv';
import sharp from 'sharp';
import makeRandom from '../../tools/makeRandom.js';

// config
dotenv.config();
sharp.cache(false);
// __dirname doesn't exist in ESM — derive it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// strip path separators / traversal sequences from a user-controlled name
const sanitizeFileName = (name) => {
    return name
        .replace(/\.\./g, '')
        .replace(/[/\\]/g, '')
        .trim() || 'unknown';
};

const addToServer = (file, settings = { secure: true, name: 'unknown' }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileName = sanitizeFileName(decodeURIComponent(settings.name));
            const resource_type = file.mimetype; // e.g., 'video/mp4'
            const isImage = file.mimetype.startsWith('image');

            const folder = settings.secure ? 'secure' : 'public';
            const finalFileName = `${fileName}-${Date.now()}-${makeRandom(0, 9, 4)}${isImage ? '.webp' : path.extname(file.originalname)}`;

            const fileStorageDir = path.join(__dirname, '../../storage', folder);
            const absoluteFilePath = path.join(fileStorageDir, finalFileName);
            const relativeFilePath = `storage/${folder}/${finalFileName}`;

            if (!fs.existsSync(fileStorageDir)) {
                fs.mkdirSync(fileStorageDir, { recursive: true });
            }

            const url = process.env.http + '/' + relativeFilePath;
            const player = filePlayers.SERVER;

            if (isImage) {
                await sharp(file.path)
                    // .resize({ width: 800 }) // Resize the image (optional)
                    .webp({ quality: 80 })
                    .toFile(absoluteFilePath);
                return resolve({ url, resource_type, player, name: fileName });
            }

            const readStream = fs.createReadStream(file.path);
            const writeStream = fs.createWriteStream(absoluteFilePath);

            readStream.pipe(writeStream);

            writeStream.on('finish', () => {
                resolve({ resource_type, url, player, name: fileName });
            });

            readStream.on('error', reject);
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const deleteFromServer = (file) => {
    return new Promise((resolve, reject) => {
        try {
            const parsedUrl = new URL(file.url);
            const pathSegments = parsedUrl.pathname.split('/');

            const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1]);
            const isSecure = pathSegments.includes('secure');

            const filePath = path.join(__dirname, '../../storage', isSecure ? 'secure' : 'public', fileName);

            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(filePath, (err) => {
                        resolve(!err);
                    });
                } else {
                    resolve(false);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

// const deleteFromServer = (file) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const parsedUrl = new URL(file.url);
//             const pathSegments = parsedUrl.pathname.split('/');

//             const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1])
//             const isSecure = pathSegments.includes('secure')

//             const filePath = path.join(__dirname, '../../storage', isSecure ? 'secure' : 'public', fileName); // Construct the file path

//             // Delete the file
//             fs.access(filePath, fs.constants.F_OK, (err) => {
//                 if (!err) {
//                     // File exists, delete it
//                     fs.unlink(filePath, (err) => {
//                         if (err) {
//                             return resolve(false)
//                         } else {
//                             return resolve(true)
//                         }
//                     });
//                 } else {
//                     return resolve(false)
//                 }
//             });
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

export { addToServer, deleteFromServer };