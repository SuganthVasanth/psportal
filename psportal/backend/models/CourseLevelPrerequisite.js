const mongoose = require('mongoose');

const prerequisiteSchema = new mongoose.Schema({
    level_id: { type: String, ref: 'CourseLevel', required: true },
    prerequisite_level_id: { type: String, ref: 'CourseLevel', required: true }
}, {
    timestamps: true
});

// Compound unique index to prevent duplicate prerequisite declarations
prerequisiteSchema.index({ level_id: 1, prerequisite_level_id: 1 }, { unique: true });

module.exports = mongoose.model('CourseLevelPrerequisite', prerequisiteSchema);
