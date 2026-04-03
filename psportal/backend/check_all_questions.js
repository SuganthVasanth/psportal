const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const fs = require('fs');

// Register models
require('./models/AdminCourse');
require('./models/QuestionBankSubmission');
require('./models/CodingProblem');
require('./models/User');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/psportal');
    
    const subs = await mongoose.model('QuestionBankSubmission').find({}).populate('course_id', 'name').lean();
    const problems = await mongoose.model('CodingProblem').find({}).lean();
    
    const result = {
      questionBankSubmissions: subs.map(s => ({ 
        id: s._id, 
        course_id: s.course_id?._id, 
        course_name: s.course_id?.name, 
        status: s.status,
        questions_count: s.questions?.length
      })),
      codingProblems: problems.map(p => ({
        id: p._id,
        title: p.title,
        courseId: p.courseId,
        levelIndex: p.levelIndex
      }))
    };

    fs.writeFileSync('all_questions.json', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
