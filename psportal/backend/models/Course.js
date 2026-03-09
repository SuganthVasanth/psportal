const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    course_name: { type: String, required: true },
    total_levels: { type: Number, required: true, default: 1 },
    course_category: { type: String, enum: ['technical', 'non-technical', 'hardware'], required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
