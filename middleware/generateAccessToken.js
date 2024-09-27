const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config()


const generateAccessToken = ({ userId }) => {
    const data = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE
    });

    let token = "Bearer " + data
    return token
}

module.exports = { generateAccessToken }