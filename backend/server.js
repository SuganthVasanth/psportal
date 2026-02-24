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

app.listen(5000, () => {
  console.log("Server running on port 5000");
});