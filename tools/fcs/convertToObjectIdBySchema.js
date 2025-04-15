const mongoose = require("mongoose");

function convertToObjectIdBySchema(match, model) {
    const schemaPaths = model.schema.paths;

    Object.keys(match).forEach((key) => {
        const value = match[key];
        // Check if the field is an ObjectId in the schema
        if (schemaPaths[key] && schemaPaths[key].instance === 'ObjectId') {
            // If it's an ObjectId, check if the value is a valid ObjectId string
            if (typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) {
                // Convert the value to ObjectId
                match[key] = new mongoose.Types.ObjectId(value);
            }
        }
    });


    return match;
}

module.exports = convertToObjectIdBySchema