const responseFile = { resource_type: 'fileType', url: '', player: 'server || bunny || cloudinary', source: 'upload || url' }


const addToCloud = (file, { name = '', folder = '', source = 'upload || url' }, url, player) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileName = settings.name || 'file-' + Date.now()
            const size = file.size
            const resource_type = file.mimetype; // e.g., 'video/mp4'

            const url = await cloudSwitcher(player, file, url)

            const uploadedFile = { resource_type, size, url, player }
            return resolve(uploadedFile)
        } catch (error) {
            reject(error)
        }
    })
}

const cloudSwitcher = (player, file, url) => {
    return new Promise(async (resolve, reject) => {
        try {
            let url = ''
            const resource_type = file.mimetype; // e.g., 'video/mp4'
            // video, file, image
            switch (player) {
                case 'server': //done
                    break;

                case 'bunny':
                    break;

                case 'cloudinary': //done
                    break;

                default:
                    return
            }

            return url
        } catch (error) {
            reject(error)
        }
    })

}