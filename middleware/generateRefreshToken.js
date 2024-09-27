const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config()


const generateRefreshToken = ({ userId }) => {
    const data = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_LIFE
    });

    let token = "Bearer " + data
    return token
}

module.exports = { generateRefreshToken }