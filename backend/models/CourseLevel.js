const mongoose = require('mongoose');

const courseLevelSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    course_id: { type: Number, ref: 'Course', required: true },
    level_number: { type: Number, required: true },
    level_title: { type: String, required: true },
    description: { type: String },
    rewards: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('CourseLevel', courseLevelSchema);
