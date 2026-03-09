const mongoose = require("mongoose");

const slotTemplateSchema = new mongoose.Schema({
  venue_id: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
  time_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }
}, { timestamps: true });

module.exports = mongoose.model("SlotTemplate", slotTemplateSchema);
