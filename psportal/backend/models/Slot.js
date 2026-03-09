const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    assessment_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Assuming it maps to an Assessment model later
    venue_id: { type: mongoose.Schema.Types.ObjectId },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    capacity: { type: Number, default: 30 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
