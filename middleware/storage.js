const multer = require("multer");
const fileTypes = require("../tools/constants/fileTypes");

const fileFilter = (req, file, cb) => {
    const allowedFiles = [fileTypes.JPEG, fileTypes.MP4, fileTypes.PDF, fileTypes.PNG, fileTypes.WebP]

    if (allowedFiles.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only PDF, images (JPEG, JPG, PNG,  WebP), or MP4 files are allowed.'), false); // Reject the file
    }
};


// const storage = multer.memoryStorage(); // Store files in memory
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}_${file.originalname.replace(" ", "-")}`
        cb(null, fileName)
    }
})


const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 100000000 }, // Limit file size to 100MB * 15 =>1.5 Giga
});

module.exports = upload