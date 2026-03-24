const mongoose = require("mongoose");

const errorLogSchema = new mongoose.Schema({
  message: String,
  stack: String,
  url: String,
  method: String,
  isOperational: Boolean,
  error: mongoose.Schema.Types.Mixed,
  statusCode: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, {
  timestamps: true,
  versionKey: false
});

const ErrorModel = mongoose.model("errorlog", errorLogSchema);
module.exports = ErrorModel