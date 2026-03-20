const mongoose = require("mongoose");

const busLocationSchema = new mongoose.Schema(
  {
    bus_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true, unique: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusLocation", busLocationSchema);

