const mongoose = require('mongoose');
const path = require('path');

// Models
const CourseSlotBooking = require('./backend/models/CourseSlotBooking');
const StudentSlotRegistration = require('./backend/models/StudentSlotRegistration');
const Slot = require('./backend/models/Slot');
const StudentExamAttempt = require('./backend/models/StudentExamAttempt');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/psportal');
  console.log('Connected to MongoDB');

  const slotIdStr = '69ceb6a6e358f609fbab4f63';
  const slotIdObj = new mongoose.Types.ObjectId(slotIdStr);

  const slot = await Slot.findById(slotIdObj);
  console.log('Slot Found:', !!slot);

  const bookingsString = await CourseSlotBooking.find({ slot_id: slotIdStr });
  const bookingsObject = await CourseSlotBooking.find({ slot_id: slotIdObj });
  console.log('Bookings (by String ID):', bookingsString.length);
  console.log('Bookings (by Object ID):', bookingsObject.length);

  const registrationsString = await StudentSlotRegistration.find({ slot_id: slotIdStr });
  const registrationsObject = await StudentSlotRegistration.find({ slot_id: slotIdObj });
  console.log('Registrations (by String ID):', registrationsString.length);
  console.log('Registrations (by Object ID):', registrationsObject.length);

  const attempts = await StudentExamAttempt.find({});
  console.log('Total Attempts in DB:', attempts.length);
  if (attempts.length > 0) {
    console.log('Last attempt sample:', {
      reg: attempts[attempts.length-1].register_no,
      course: attempts[attempts.length-1].course_id
    });
  }

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
