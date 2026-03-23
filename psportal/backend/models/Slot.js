const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    allowed_courses: [{
        course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminCourse', required: true },
        level_indices: [{ type: Number }]
    }],
    venue_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    time_slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    slot_template_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SlotTemplate' },
    date: { type: Date, required: true },
    capacity: { type: Number, default: 30 },
    booked_count: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Slot', slotSchema);
