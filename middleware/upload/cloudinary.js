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
            const result = await cloudinary.uploader.upload(path, {
                resource_type: 'auto',
                folder: settings.folder || 'admin'
            })
            const { original_filename, resource_type, secure_url, url, format, bytes } = result

            const createdFile = {}
            createdFile.original_filename = original_filename
            createdFile.resource_type = resource_type + '/' + format
            createdFile.url = secure_url
            createdFile.size = bytes


            if (createdFile) {
                resolve(createdFile)
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

//    
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