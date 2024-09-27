const cloudinary = require("cloudinary").v2
const dotenv = require("dotenv")
const vimeo = require('vimeo-upload-client');



// congig
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})

const addToCloud = (file, settings) => {
    return new Promise(async (resolve, reject) => {
        try {
            const path = file.path
            const result = await cloudinary.uploader.upload(path, settings)
            if (result) {
                resolve(result)
            }
        } catch (error) {
            reject(error)
        }
    })
}

const deleteFromCloud = (uri) => {

    return new Promise(async (resolve, reject) => {
        try {
            if (!uri.startsWith('http')) return resolve()

            const uriSplitted = uri.split('/')
            const folder = uriSplitted[uriSplitted.length - 2].startsWith("v1") ? '' : uriSplitted[uriSplitted.length - 2] + '/'
            const file = uriSplitted[uriSplitted.length - 1]
            const filename = file.split('.')[0]

            const public_id = `${folder}${filename}`
            const result = await cloudinary.uploader.destroy(public_id)
            // console.log('from here')
            if (result === "ok") {
                resolve(result)
            } else {
                reject('Not found file')
            }

        } catch (error) {
            reject(error)
        }
    })
}

// const addToVimeo = (file) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN
//             console.log('from here ')
//             const response = await axios.post(
//                 "https://api.vimeo.com/me/videos",
//                 {
//                     upload: {
//                         approach: "tus",
//                         size: `${file.size}`,
//                     },
//                 },
//                 {
//                     headers: {
//                         Authorization: `Bearer ${VIMEO_ACCESS_TOKEN}`,
//                         "Content-Type": "application/json",
//                         Accept: "application/vnd.vimeo.*+json;version=3.4",
//                     },
//                 },
//             );
//             console.log('from here ', response)

//             const uploadLink = response.data.upload.upload_link;

//             console.log('upload link ==>', uploadLink)

//             await axios.patch(uploadLink, file.buffer, {
//                 headers: {
//                     "Content-Type": "application/offset+octet-stream",
//                     "Upload-Offset": "0",
//                     "Tus-Resumable": "1.0.0",
//                 },
//             });

//             resolve({ res: response.data, file })

//         } catch (error) {
//             console.log('eerror', error)
//             reject(error)
//         }
//     })
// }

const addToVimeo = (file) => {

    return new Promise(async (resolve, reject) => {
        try {

            const clientID = process.env.VIMEO_CLIENT_ID
            const clientSecret = process.env.VIMEO_CLIENT_SECRET
            const accessToken = process.env.VIMEO_ACCESS_TOKEN

            var vimeoClient = new vimeo(clientID, clientSecret, accessToken);
            var params = {
                video: file.path,
                name: 'name',
                description: 'description',
                folder: 'vimeo folderID' //Optional if you want to upload the file to a specific folder
            };

            vimeoClient.uploadFromLink(params).then(res => {
                console.log(res)
                resolve(res)
            })
        } catch (error) {
            reject(error)
        }
    })
}

//return { original_filename, resource_type, secure_url, url, format, bytes } 
module.exports = { addToCloud, deleteFromCloud, addToVimeo }