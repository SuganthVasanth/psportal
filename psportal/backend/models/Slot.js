const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminCourse', required: true },
    venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    time_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    date: { type: Date, required: true },
    capacity: { type: Number, default: 30 },
    booked_count: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
