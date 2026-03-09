/**
 * Set mentor_id for a student identified by email.
 * Run from backend: node scripts/setMentorForStudent.js
 *
 * Usage: sets mentor_id 69a6662f8d280c3eb093ad21 for vidula2005@gmail.com
 */
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const User = require("../models/User");
const Student = require("../models/Student");

const STUDENT_EMAIL = "vidula2005@gmail.com";
const MENTOR_ID = "69a6662f8d280c3eb093ad21";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    const user = await User.findOne({ email: STUDENT_EMAIL }).lean();
    if (!user) {
      console.error("User not found with email:", STUDENT_EMAIL);
      process.exit(1);
    }
    const userId = user._id;

    let student = await Student.findOne({ user_id: userId });
    if (!student) {
      // No Student linked to this user: create one so leave flow and dashboard work
      const registerNo = "7376231CS320";
      student = await Student.create({
        _id: "S_" + registerNo,
        user_id: userId,
        name: user.name || "Vidula",
        register_no: registerNo,
        mentor_id: new mongoose.Types.ObjectId(MENTOR_ID),
        department: "Computer Science and Engineering",
        type: "dayscholar",
      });
      console.log("Created Student:", student.register_no, "(", student.name, ") with mentor_id:", MENTOR_ID);
    } else {
      student.mentor_id = new mongoose.Types.ObjectId(MENTOR_ID);
      await student.save();
      console.log("Updated Student:", student.register_no, "(", student.name, ") -> mentor_id:", MENTOR_ID);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
