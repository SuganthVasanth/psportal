const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

exports.getAttendanceByRegisterNo = async (req, res) => {
  try {
    const { register_no } = req.query;
    if (!register_no) {
      return res.status(400).json({ message: "register_no required" });
    }
    const student = await Student.findOne({ register_no }).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const studentId = student._id.toString();
    let attendance = await Attendance.findOne({ student_id: studentId }).lean();
    if (!attendance) {
      return res.json({
        student_id: studentId,
        percentage: 0,
        presentDays: 0,
        absentDays: 0,
        records: [],
      });
    }
    res.json(attendance);
  } catch (err) {
    console.error("getAttendanceByRegisterNo error:", err);
    res.status(500).json({ message: "Failed to load attendance" });
  }
};
