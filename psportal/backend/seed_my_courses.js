const mongoose = require('mongoose');
const AdminCourse = require('./models/AdminCourse');
const StudentLevelProgress = require('./models/StudentLevelProgress');

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/psportal');
    console.log('Connected to MongoDB');

    // 1. Find or create C Programming course with levels
    let cProg = await AdminCourse.findOne({ name: /C Programming/i });
    if (!cProg) {
      cProg = new AdminCourse({
        name: 'C Programming',
        description: 'Learn C programming from scratch',
        status: 'Active',
      });
    }

    cProg.levels = [
      { name: 'Basics of C', rewardPoints: 100, assessmentType: 'MCQ', topics: ['Variables', 'Data Types'] },
      { name: 'Control Flow', rewardPoints: 200, assessmentType: 'Coding', topics: ['If-Else', 'Loops'] },
      { name: 'Functions', rewardPoints: 300, assessmentType: 'Coding', topics: ['Parameters', 'Return Types'] },
      { name: 'Pointers', rewardPoints: 500, assessmentType: 'Coding', topics: ['Memory', 'Addresses'] }
    ];
    await cProg.save();
    console.log('Updated C Programming with levels');

    // 2. Add progress for student 7376231CS323
    const registerNo = '7376231CS323';
    await StudentLevelProgress.deleteMany({ register_no: registerNo });
    await StudentLevelProgress.create({
      register_no: registerNo,
      course_id: cProg._id.toString(),
      level_index: 0,
      status: 'enrolled'
    });
    console.log('Added initial progress for student 7376231CS323');

    // 3. Add another course with levels
    let javaProg = await AdminCourse.findOne({ name: /Java Programming/i });
    if (!javaProg) {
        javaProg = await AdminCourse.create({
            name: 'Java Programming',
            description: 'Introduction to Java',
            status: 'Active',
            levels: [
                { name: 'Java Intro', rewardPoints: 150, assessmentType: 'MCQ', topics: ['JVM', 'JDK'] },
                { name: 'OOP Basics', rewardPoints: 300, assessmentType: 'Coding', topics: ['Classes', 'Objects'] }
            ]
        });
        console.log('Created Java Programming course');
    }
    
    await StudentLevelProgress.create({
        register_no: registerNo,
        course_id: javaProg._id.toString(),
        level_index: 1, // Enrolled in level 2 (index 1)
        status: 'enrolled'
    });
    console.log('Added Java progress for student 7376231CS323');

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    process.exit(0);
  }
}

seed();
