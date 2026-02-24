const mongoose = require('mongoose');

const studentSlotRegistrationSchema = new mongoose.Schema({
    slot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['attendance_marked', 'registered', 'attended', 'missed'], default: 'registered' },
    attendance_marked_by: { type: mongoose.Schema.Types.ObjectId },
    attendance_marked_at: { type: Date }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudentSlotRegistration', studentSlotRegistrationSchema);
