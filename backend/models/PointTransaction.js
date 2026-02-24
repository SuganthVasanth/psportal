const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
    student_id: { type: String, ref: 'Student', required: true },
    activity_title: { type: String, required: true }, // e.g., "Placement - Workhall placement drive"
    activity_category: { type: String, required: true }, // e.g., "T&P Training"
    activity_status: { type: String, default: "Completed" },
    points_earned: { type: Number, required: true },
    date_earned: { type: Date, default: Date.now },
    description: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
