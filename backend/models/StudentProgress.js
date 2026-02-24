const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
    student_id: { type: String, ref: 'Student', required: true },
    level_id: { type: String, ref: 'CourseLevel', required: true },
    attempts: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    score: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudentProgress', studentProgressSchema);
