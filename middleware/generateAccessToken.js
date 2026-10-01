import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config()


const generateAccessToken = (data = {}) => {
    const createdToken = jwt.sign({ ...data }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE
    });

    let token = "Bearer " + createdToken
    return token
}

export { generateAccessToken };