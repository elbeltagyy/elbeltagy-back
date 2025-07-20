const multer = require("multer");
const fileTypes = require("../tools/constants/fileTypes");

const fileFilter = (req, file, cb) => {
    const allowedFiles = [fileTypes.JPEG, fileTypes.PDF, fileTypes.PNG, fileTypes.WebP] //fileTypes.MP4,

    if (allowedFiles.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Only PDF, images (JPEG, JPG, PNG,  WebP) files are allowed.'), false); // Reject the file , or MP4
    }
};


// const storage = multer.memoryStorage(); // Store files in memory
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}_${file.originalname.replace(" ", "-")}`
        cb(null, fileName)
    }
})
const secureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "storage/secure"); // or wherever you want to store
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const uploadAndStore = multer({
    storage: secureStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 }, // Limit file size to 100MB * 15
});

// #### uploader #####
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 }, // Limit file size to 100MB * 15
});

const imageUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedFiles = [fileTypes.JPEG, fileTypes.PNG, fileTypes.WebP] //fileTypes.MP4,
        if (allowedFiles.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image formats allowed!'));
        }
    },
    limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

const pdfUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf format allowed!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

module.exports = { upload, imageUpload, uploadAndStore }