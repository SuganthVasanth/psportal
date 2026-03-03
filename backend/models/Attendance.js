const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    time: { type: String, required: true },
    shift: { type: String, required: true },
    status: { type: String, required: true }, // e.g., "Present", "Absent"
    markedBy: { type: String }
}, { _id: false });

const recordSchema = new mongoose.Schema({
    date: { type: String, required: true }, // "DD MMM YYYY" format like "02 Mar 2026"
    sessions: [sessionSchema]
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    student_id: { type: String, ref: 'Student', required: true, unique: true },
    percentage: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    records: [recordSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);
