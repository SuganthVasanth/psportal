const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // e.g., 'S_7376231CS323'
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Links to the Auth User
    name: { type: String, required: true },
    register_no: { type: String, required: true },
    profile_pic: { type: String },
    activity_points: { type: Number, default: 0 },
    department: { type: String, default: "Computer Science and Engineering" },
    mentor_id: { type: mongoose.Schema.Types.ObjectId },
    warden_id: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['hosteler', 'dayscholar'], default: 'dayscholar' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
