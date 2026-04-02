const mongoose = require('mongoose');
const CourseSlotBooking = require('./models/CourseSlotBooking');
const Slot = require('./models/Slot');
const TimeSlot = require('./models/TimeSlot');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/psportal');
  const bookings = await CourseSlotBooking.find({ processed: { $ne: true } })
    .populate({
      path: "slot_id",
      populate: { path: "time_slot_id" }
    })
    .lean();
  console.log(JSON.stringify(bookings, null, 2));
  process.exit(0);
}
check();
