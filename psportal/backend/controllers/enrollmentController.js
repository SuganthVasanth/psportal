const Enrollment = require("../models/Enrollment");
const PSCourse = require("../models/PSCourse");

exports.enroll = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;
    if (!courseId || !studentId) return res.status(400).json({ message: "courseId and studentId required" });
    const course = await PSCourse.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.status !== "Active") return res.status(400).json({ message: "Course is not available for enrollment" });
    const existing = await Enrollment.findOne({ courseId, studentId });
    if (existing) return res.status(200).json({ message: "Already enrolled", enrollment: existing });
    const doc = await Enrollment.create({ courseId, studentId, progress: 0 });
    res.status(201).json({ id: doc._id.toString(), courseId, studentId, progress: 0 });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ message: "Already enrolled" });
    console.error("enroll error:", err);
    res.status(500).json({ message: err.message || "Failed to enroll" });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user?.register_no || req.query.studentId;
    if (!studentId) return res.status(400).json({ message: "studentId or register_no required" });
    const list = await Enrollment.find({ studentId }).populate("courseId", "name description status prereq").lean();
    res.json(
      list.map((e) => ({
        id: e._id.toString(),
        courseId: e.courseId?._id?.toString(),
        name: e.courseId?.name,
        description: e.courseId?.description,
        progress: e.progress ?? 0,
        prereq: Array.isArray(e.courseId?.prereq) ? e.courseId.prereq : [],
      }))
    );
  } catch (err) {
    console.error("getMyEnrollments error:", err);
    res.status(500).json({ message: err.message || "Failed to load enrollments" });
  }
};
