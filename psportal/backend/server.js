const express = require("express");
const cors = require("cors");
const passport = require("passport");

require("dotenv").config();
require("./config/passport");

const app = express();

const connectDB = require("./config/db");

connectDB();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("PS Portal Backend Running 🚀");
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

// Student: active slots and book slot
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api", bookingRoutes);

// Question banks: faculty submit, auth required
const questionBankRoutes = require("./routes/questionBankRoutes");
app.use("/api/question-banks", questionBankRoutes);

// Upload (auth optional for now - can add authMiddleware if needed)
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);

// Messages (admin-faculty chat), auth required
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

// Leaves: student leave applications (stored in MongoDB, overlap check on apply)
const leaveRoutes = require("./routes/leaveRoutes");
app.use("/api/leaves", leaveRoutes);

// Seed: push fake students (and their courses, points) into MongoDB
const seedRoutes = require("./routes/seedRoutes");
app.use("/api/seed", seedRoutes);

app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:5000");
});