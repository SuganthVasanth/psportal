const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["text", "file"], default: "text" },
  content: { type: String, default: "" },
  file_url: { type: String, default: "" },
  file_name: { type: String, default: "" },
  suggested_changes: { type: String, default: "" },
}, { timestamps: true });

messageSchema.index({ from_user_id: 1, to_user_id: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
