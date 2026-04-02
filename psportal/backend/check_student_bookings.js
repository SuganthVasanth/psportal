const mongoose = require('mongoose');
const CourseSlotBooking = require('./models/CourseSlotBooking');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/psportal');
  // Find STU register no
  const students = await mongoose.connection.db.collection('students').find({ name: /Student/i }).toArray();
  console.log('Students found:', students.map(s => ({ name: s.name, reg: s.register_no })));
  
  const regNos = students.map(s => s.register_no);
  const bookings = await CourseSlotBooking.find({ register_no: { $in: regNos } }).lean();
  console.log('Bookings for these students:', bookings.length);
  bookings.forEach((b, i) => {
    console.log(`Booking ${i+1}: ${b.course_name} | processed: ${b.processed} | time: ${b.time_label} | reg: ${b.register_no} | venue: ${b.venue_label} | date: ${b.date || b.createdAt}`);
  });
  process.exit(0);
}
check();
