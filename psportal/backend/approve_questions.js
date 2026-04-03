const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const AdminCourse = require('./models/AdminCourse');
const QuestionBankSubmission = require('./models/QuestionBankSubmission');

async function approve() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/psportal');
    
    const targetId = '69afb5bbbba421d4ea77ab6d';
    const targetCourse = await AdminCourse.findById(targetId).lean();
    if (!targetCourse) {
       console.log('Course not found');
       process.exit(1);
    }

    const sameNameCourses = await AdminCourse.find({ name: targetCourse.name }).lean();
    const courseIds = sameNameCourses.map(c => c._id);

    const result = await QuestionBankSubmission.updateMany(
      { course_id: { $in: courseIds } },
      { $set: { status: 'approved' } }
    );

    console.log(`Updated ${result.modifiedCount} submissions to 'approved'`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

approve();
