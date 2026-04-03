const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const AdminCourse = require('../models/AdminCourse');
const QuestionBankSubmission = require('../models/QuestionBankSubmission');
const User = require('../models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/psportal');
    console.log('Connected to MongoDB');

    const courseName = 'C Programming';
    const courses = await AdminCourse.find({ name: new RegExp(courseName, 'i') }).lean();
    if (courses.length === 0) {
      console.log(`No course found with name matching "${courseName}"`);
      process.exit(1);
    }

    const adminUser = await User.findOne({}).lean(); // Just pick the first user for seeding
    if (!adminUser) {
      console.log('No user found to associate with the submission');
      process.exit(1);
    }

    const templateIds = {
      mcq: '69b2d36d975c331e58302d42',
      programming: '69b2d36d975c331e58302d3f'
    };

    for (const course of courses) {
      const existing = await QuestionBankSubmission.findOne({ course_id: course._id });
      if (existing) {
        console.log(`Submission already exists for course: ${course.name} (${course._id})`);
        existing.status = 'approved';
        await existing.save();
        continue;
      }

      const submission = new QuestionBankSubmission({
        course_id: course._id,
        user_id: adminUser._id,
        status: 'approved',
        title: 'Default Question Bank',
        content: 'Auto-generated for testing purposes',
        questions: [
          {
            questionNumber: 1,
            template_id: templateIds.mcq,
            value: {
              q: 'What is the correct syntax to output "Hello World" in C?',
              mcq: {
                options: [
                  'printf("Hello World");',
                  'echo "Hello World";',
                  'System.out.println("Hello World");',
                  'console.log("Hello World");'
                ],
                correctIndex: 0
              }
            },
            correctAnswerKey: '0'
          },
          {
            questionNumber: 2,
            template_id: templateIds.programming,
            value: {
              ps: 'Write a C program to find the sum of two numbers.',
              in: 'Two integers a and b.',
              out: 'Sum of a and b.',
              tc: 'Input: 5 10\nOutput: 15'
            },
            correctAnswerKey: '15'
          }
        ]
      });

      await submission.save();
      console.log(`Created and approved question bank for course: ${course.name} (${course._id})`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
