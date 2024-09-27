const multer = require("multer")


const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        const fileName = `${Date.now()}_${file.originalname.replace(" ", "-")}`
        // console.log(fileName)
        cb(null, fileName)
    }
})
const upload = multer({ storage })

module.exports = upload



// limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit to 10MB
// fileFilter(req, file, cb) {
//   // Check the file extension for allowed image types (jpg, jpeg, png, gif)
//   const ext = path.extname(file.originalname).toLowerCase();
//   if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.gif') {
//     return cb(new Error('Only images are allowed'));
//   }
//   cb(null, true);
// }