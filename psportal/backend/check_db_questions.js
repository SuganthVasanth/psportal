const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const AdminCourse = require('./models/AdminCourse');
const QuestionBankSubmission = require('./models/QuestionBankSubmission');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/psportal');
    
    // 1. Find the target course
    const targetId = '69afb5bbbba421d4ea77ab6d';
    const targetCourse = await AdminCourse.findById(targetId).lean();
    console.log('Target Course:', targetCourse ? { id: targetCourse._id, name: targetCourse.name } : 'Not Found');

    if (targetCourse) {
      // 2. Find all courses with the same name
      const sameNameCourses = await AdminCourse.find({ name: targetCourse.name }).lean();
      const courseIds = sameNameCourses.map(c => c._id);
      console.log('Same Name Courses:', sameNameCourses.map(c => ({ id: c._id, name: c.name })));

      // 3. Find question bank submissions for these courses
      const subs = await QuestionBankSubmission.find({ course_id: { $in: courseIds } }).populate('course_id', 'name').lean();
      console.log('Submissions found:', subs.length);
      subs.forEach(s => {
        console.log(`- Sub ID: ${s._id}, Course ID: ${s.course_id?._id}, Status: ${s.status}, Course: ${s.course_id?.name}`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
