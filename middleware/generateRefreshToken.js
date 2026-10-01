import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config()


const generateRefreshToken = (data = {}) => {
    const createdToken = jwt.sign({ ...data }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_LIFE
    });

    let token = "Bearer " + createdToken
    return token
}

export { generateRefreshToken };