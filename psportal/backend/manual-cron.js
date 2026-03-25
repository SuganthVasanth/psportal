const fs = require('fs');
function log(msg) { fs.appendFileSync('cron-log.txt', msg + '\\n'); }

require("dotenv").config();
const mongoose = require("mongoose");
const { processExpiredBooking } = require("./services/cronService");
const CourseSlotBooking = require("./models/CourseSlotBooking");

async function manualRun() {
  log("Starting manual cron run...");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/psportal");
  log("Connected to DB.");
  
  const now = new Date();
  const pendingBookings = await CourseSlotBooking.find({ processed: { $ne: true } })
    .populate({
      path: "slot_id",
      populate: { path: "time_slot_id" }
    });

  log(`Found ${pendingBookings.length} pending bookings.`);
  
  for (const booking of pendingBookings) {
    const slot = booking.slot_id;
    if (!slot) {
      log(`Booking ${booking._id} has no slot. Marking processed.`);
      booking.processed = true;
      await booking.save();
      continue;
    }
    const timeSlot = slot.time_slot_id;
    if (!timeSlot || !slot.date) {
      log(`Booking ${booking._id} slot has no timeSlot or date. Marking processed.`);
      booking.processed = true;
      await booking.save();
      continue;
    }

    const endTimeStr = timeSlot.endTime || "23:59";
    const [hours, minutes] = endTimeStr.split(":").map(Number);
    const slotEndDate = new Date(slot.date);
    slotEndDate.setHours(hours, minutes, 0, 0);

    const gracePeriodMs = 5 * 60 * 1000;
    
    if (now.getTime() > (slotEndDate.getTime() + gracePeriodMs)) {
      log(`Processing expired booking ${booking._id}...`);
      try {
        await processExpiredBooking(booking);
      } catch(e) {
        log("Error: " + e.stack);
      }
    } else {
      log(`Booking ${booking._id} is not expired yet.`);
    }
  }

  log("Done.");
  process.exit(0);
}

manualRun().catch(e => log(e.stack));
