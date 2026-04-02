const mongoose = require('mongoose');
const CourseSlotBooking = require('./models/CourseSlotBooking');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/psportal');
  const bookings = await CourseSlotBooking.find({ 
    $or: [ { processed: false }, { processed: { $exists: false } } ] 
  }).lean();
  console.log('Unprocessed bookings:', bookings.length);
  console.log(JSON.stringify(bookings, null, 2));
  process.exit(0);
}
check();
