const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const passport = require("passport");

require("dotenv").config();
require("./config/passport");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

const connectDB = require("./config/db");
const { seedDefaultQuestionTemplates } = require("./templates/seedDefaultQuestionTemplates");

connectDB()
  .then(seedDefaultQuestionTemplates)
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("DB connection or seeding failed", err);
  });

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("PS Portal Backend Running ");
});

// Use your auth routes instead of duplicating them
const authRoutes = require("./routes/authRoutes");
const roleRoutes = require("./routes/roleRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);

// Dashboard routes
const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

// Movement Pass routes
const movementPassRoutes = require("./routes/movementPassRoutes");
app.use("/api/movement-pass", movementPassRoutes);

// Super Admin dashboard data (roles, users, courses, venues, slots, leave types, settings)
const superadminRoutes = require("./routes/superadminRoutes");
app.use("/api/superadmin", superadminRoutes);

// Student: available courses and level registration
const studentCourseRoutes = require("./routes/studentCourseRoutes");
app.use("/api/courses", studentCourseRoutes);

// PS Courses (from docx seed): GET list, POST/PUT admin CRUD, collection 'courses'
const psCourseRoutes = require("./routes/psCourseRoutes");
app.use("/api/ps-courses", psCourseRoutes);

const enrollmentRoutes = require("./routes/enrollmentRoutes");
app.use("/api/enrollments", enrollmentRoutes);

// Student: active slots and book slot
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api", bookingRoutes);

// Question banks: faculty submit, auth required
const questionBankRoutes = require("./routes/questionBankRoutes");
app.use("/api/question-banks", questionBankRoutes);

// Question type layouts: admin CRUD, faculty read by type
const questionTypeLayoutRoutes = require("./routes/questionTypeLayoutRoutes");
app.use("/api/question-type-layouts", questionTypeLayoutRoutes);

// Question templates: admin template builder (layout with x,y,width,height)
const templateRoutes = require("./routes/templateRoutes");
app.use("/api/templates", templateRoutes);

// Upload (auth optional for now - can add authMiddleware if needed)
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);

// Messages (admin-faculty chat), auth required
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

// Leaves: student leave applications (stored in MongoDB, overlap check on apply)
const leaveRoutes = require("./routes/leaveRoutes");
app.use("/api/leaves", leaveRoutes);

// Attendance: student attendance by register_no
const attendanceRoutes = require("./routes/attendanceRoutes");
app.use("/api/attendance", attendanceRoutes);

// Bus routes + tracking
const busRoutes = require("./routes/busRoutes");
app.use("/api/buses", busRoutes);

// Practice / coding: courses, levels, problems, daily task, streak, submissions, leaderboard
const practiceRoutes = require("./routes/practiceRoutes");
app.use("/api/practice", practiceRoutes);

// External coding questions (LeetCode etc.)
const externalCodingRoutes = require("./routes/externalCodingRoutes");
app.use("/api/external", externalCodingRoutes);

// C compiler: run C code (temp dir, gcc, timeout)
const compilerRoutes = require("./routes/compilerRoutes");
app.use("/api/compiler", compilerRoutes);

// Coding practice: Codeforces problems + Judge0 run/submit (no DB for questions)
const codingPracticeRoutes = require("./routes/codingPracticeRoutes");
app.use("/api/coding", codingPracticeRoutes);

// Seed: push fake students (and their courses, points) into MongoDB
const seedRoutes = require("./routes/seedRoutes");
app.use("/api/seed", seedRoutes);

io.on("connection", (socket) => {
  socket.on("join-bus", (busId) => {
    if (!busId) return;
    socket.join(`bus-${busId}`);
  });

  socket.on("update-location", (data) => {
    const { busId, latitude, longitude } = data || {};
    if (!busId || latitude == null || longitude == null) return;
    io.to(`bus-${busId}`).emit("location-updated", { latitude, longitude });
  });
});

server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});