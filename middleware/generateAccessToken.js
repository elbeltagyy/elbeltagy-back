const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config()


const generateAccessToken = (data = {}) => {
    const createdToken = jwt.sign({ ...data }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE
    });

    let token = "Bearer " + createdToken
    return token
}

module.exports = { generateAccessToken }