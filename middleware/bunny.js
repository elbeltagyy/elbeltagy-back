const fs = require('fs')
const axios = require('axios');

const filePlayers = require('../tools/constants/filePlayers');
const fileTypes = require('../tools/constants/fileTypes');

const apiKey = '330bfc43-e10a-462a-8af602136946-f87a-4dbb'; // BunnyCDN FTP/Storage API key
const libraryId = '318555'; // BunnyCDN storage zone name

const BUNNYCDN_API_KEY = 'b3caa0f9-fd55-4a8b-8001ee04e114-d05d-45c2'; // For FILES
const STORAGE_ZONE_NAME = 'pdf-elbeltagy'; // For FILES

const addToBunny = (file, settings) => {
    return new Promise(async (resolve, reject) => {
        try {
            const filePath = file.path
            const resource_type = file.mimetype; // e.g., 'video/mp4'

            // upload pdf
            if (resource_type === fileTypes.PDF) {
                const fileStream = fs.createReadStream(filePath);
                const fileName = settings.name
                const uploadUrl = `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/${fileName}`;
                await axios.put(uploadUrl, fileStream, {
                    headers: {
                        'AccessKey': BUNNYCDN_API_KEY,
                        'Content-Type': 'application/pdf', // Set the content type as PDF
                    },
                });

                const url = `https://${STORAGE_ZONE_NAME}.bunnycdn.com/${fileName}`;
                const player = filePlayers.BUNNY_UPLOAD
                return resolve({ url, resource_type, player })
            }
            // Upload video to BunnyCDN streaming
            const videoData = fs.readFileSync(filePath);

            const response = await axios.post(
                `https://video.bunnycdn.com/library/${libraryId}/videos`,
                { title: settings.name },
                {
                    headers: {
                        Accept: 'application/json',
                        AccessKey: apiKey,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const videoId = response.data.guid;
            // Upload the video file to the newly created video record
            const result = await axios.put(
                `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
                videoData,
                {
                    headers: {
                        Accept: 'application/json',
                        AccessKey: apiKey,
                        'Content-Type': 'application/octet-stream',
                    },
                }
            );


            if (result) {
                const url = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`
                const player = filePlayers.BUNNY_UPLOAD
                resolve({ url, resource_type, player })
            }
        } catch (error) {
            reject(error)
        }
    })
}


module.exports = { addToBunny }