const mongoose = require('mongoose');
const CourseSlotBooking = require('./models/CourseSlotBooking');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/psportal');
  const bookings = await CourseSlotBooking.find({}, { course_name: 1, processed: 1, booked_at: 1, register_no: 1, venue_label: 1 }).lean();
  console.log(JSON.stringify(bookings, null, 2));
  process.exit(0);
}
check();
