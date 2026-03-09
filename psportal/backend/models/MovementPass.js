const mongoose = require('mongoose');

const movementPassSchema = new mongoose.Schema({
    student_id: { type: String, required: true }, // Referencing the student _id (e.g., 'S_7376231CS323')
    date: { type: Date, required: true, default: Date.now },
    startTime: { type: String, required: true }, // Format: "HH:MM" (24hr) or "hh:mm A"
    endTime: { type: String, required: true },
    purpose: { type: String, required: true },
    session: { type: String, enum: ['forenoon', 'afternoon'], required: true },
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' }
}, {
    timestamps: true
});

module.exports = mongoose.model('MovementPass', movementPassSchema);
