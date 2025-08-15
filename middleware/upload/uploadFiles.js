const dotenv = require("dotenv")
const { addToServer, deleteFromServer } = require("./uploadServer")
const { addToCloud, deleteFromCloud } = require("./cloudinary")
dotenv.config()

const uploadFile = (file, settings, meta = {}) => {

    return new Promise(async (resolve, reject) => {
        try {
            if (!file) {
                delete parent[key]
                return resolve()
            }

            if (process.env.host === 'server') {
                const res = await addToServer(file, settings)
                if (meta?.parent && meta?.key) {
                    parent[key] = res
                }
                return resolve(res)
            } else {
                const res = await addToCloud(file, settings)
                if (meta?.parent && meta?.key) {
                    parent[key] = res
                }
                return resolve(res)
            }
        } catch (error) {
            reject(error)
            return
        }
    })
}

const deleteFile = (file) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (process.env.host === 'server' && file?.url?.startsWith(process.env.http)) {
                console.log(file)
                const res = await deleteFromServer(file)
                return resolve(res)
            } else {
                // const res = await deleteFromCloud(file.url)
                return resolve()
            }
        } catch (error) {
            reject(error)
        }
    })
}
module.exports = { uploadFile, deleteFile }