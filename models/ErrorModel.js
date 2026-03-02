const mongoose = require("mongoose");

const errorLogSchema = new mongoose.Schema({
  message: String,
  stack: String,
  url: String,
  method: String,
  isOperational: Boolean,
  error: mongoose.Schema.Types.Mixed
}, {
    timestamps: true,
    versionKey: false
});

const ErrorModel = mongoose.model("errorlog", errorLogSchema);
module.exports = ErrorModel