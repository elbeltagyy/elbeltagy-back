import dotenv from 'dotenv';
import { addToServer, deleteFromServer } from './uploadServer.js';
import { addToCloud, deleteFromCloud } from './cloudinary.js';
import fs from 'fs';
dotenv.config()

// const safeUnlink = async (filePath, { retries = 5, delayMs = 200 } = {}) => {
//     if (!filePath) return;

//     for (let attempt = 0; attempt <= retries; attempt++) {
//         try {
//             await fs.promises.unlink(filePath);
//             return; // success
//         } catch (error) {
//             if (error.code === 'ENOENT') {
//                 return; // already gone — fine
//             }
//             const isLocked = error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'EACCES';
//             if (isLocked && attempt < retries) {
//                 await new Promise(r => setTimeout(r, delayMs));
//                 continue;
//             }
//             // out of retries or a different error — swallow it, just log
//             console.error(`safeUnlink failed for ${filePath}:`, error.code);
//             return;
//         }
//     }
// };
const safeUnlink = async (filePath) => {
    if (!filePath) return;
    try {
        await fs.promises.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error; // real problem — not just "already gone"
        }
        // file didn't exist — nothing to do
    }
};


const uploadFile = (file, settings, meta = {}) => {

    return new Promise(async (resolve, reject) => {
        try {
            if (!file) {
                // delete parent[key]
                return resolve()
            }

            if (process.env.host === 'server') {
                const res = await addToServer(file, settings)
                await safeUnlink(file.path)
                return resolve(res)
            } else {
                const res = await addToCloud(file, settings)
                await safeUnlink(file.path)
                return resolve(res)
            }
        } catch (error) {
            await safeUnlink(file.path);
            reject(error)
        }
    })
}
const deleteFile = async (file) => {
    const url = typeof file === "string"
        ? file
        : file?.url;

    if (!url) return;
    try {
        if (process.env.host === "server") {
            if (!url.startsWith(process.env.http)) return;

            return await deleteFromServer(
                typeof file === "string"
                    ? { url }
                    : file
            );
        }

        // Delete from cloud storage when configured
        // return await deleteFromCloud(url);
        // const res = await deleteFromCloud(file.url)

    } catch (error) {
        throw error;
    }
};

export { uploadFile, deleteFile };