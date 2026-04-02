const mongoose = require('mongoose');
const CourseSlotBooking = require('./models/CourseSlotBooking');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/psportal');
  const bookings = await CourseSlotBooking.find({}).lean();
  console.log('Total bookings:', bookings.length);
  bookings.forEach((b, i) => {
    console.log(`--- Booking ${i+1} ---`);
    console.log(JSON.stringify(b, null, 2));
  });
  process.exit(0);
}
check();
