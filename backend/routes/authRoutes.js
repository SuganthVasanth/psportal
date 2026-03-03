const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
const Student = require("../models/Student");
require("dotenv").config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Ensure student has a Student record and return register_no (create one if missing)
async function ensureStudentRegisterNo(user) {
  let student = await Student.findOne({ user_id: user._id }).lean();
  if (student) return student.register_no;
  const register_no = "STU" + user._id.toString().slice(-8).toUpperCase();
  await Student.create({
    _id: "S_" + register_no,
    user_id: user._id,
    name: user.name || user.email?.split("@")[0] || "Student",
    register_no,
    profile_pic: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png",
    activity_points: 0,
    department: "Computer Science and Engineering",
    type: "dayscholar",
  });
  return register_no;
}

// Email/password login (for super admin and other password-based users)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await User.findOne({ email }).select("+password").populate("roles");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.password) {
      return res.status(401).json({ message: "This account uses Google sign-in. Please sign in with Google." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const roleNames = (user.roles || []).map((r) => r.role_name);
    const token = jwt.sign(
      { userId: user._id, roles: roleNames, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    const isStudent = roleNames.some((r) => (r || "").toLowerCase() === "student");
    let register_no = null;
    if (isStudent) {
      register_no = await ensureStudentRegisterNo(user);
    }
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: roleNames,
        ...(register_no && { register_no }),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub } = payload;

    let user = await User.findOne({ email }).populate("roles");

    if (!user) {
      // Check if they are the hardcoded system admins before rejecting
      const isSystemAdmin = email === "suganth.cs23@bitsathy.ac.in" || email === "rsuganth98@gmail.com";

      if (!isSystemAdmin) {
        return res.status(403).json({
          message: "Access Denied: Your email is not registered in the system. Please contact your administrator to be assigned a role."
        });
      }

      // If they are a system admin logging in for the VERY first time,
      // create a barebones user profile so the bootstrap block below can attach their role.
      user = await User.create({
        name,
        email,
        google_id: sub,
        roles: []
      });
      user = await user.populate("roles");
    } else {
      // If user was a placeholder (pre-assigned role), they won't have a google_id or name yet
      if (!user.google_id) {
        user.google_id = sub;
        user.name = name;
        await user.save();
      }
    }



    const roleNames = user.roles.map(r => r.role_name);

    const isStudent = roleNames.some((r) => (r || "").toLowerCase() === "student");
    let register_no = null;
    if (isStudent) {
      register_no = await ensureStudentRegisterNo(user);
    }

    const appToken = jwt.sign(
      {
        userId: user._id,
        roles: roleNames,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token: appToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: roleNames,
        ...(register_no && { register_no })
      }
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid Google Token" });
  }
});

// Return current user profile including register_no for students (so frontend can set it if missing)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token required" });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate("roles");
    if (!user) return res.status(401).json({ message: "User not found" });
    const roleNames = (user.roles || []).map((r) => r.role_name);
    const isStudent = roleNames.some((r) => (r || "").toLowerCase() === "student");
    let register_no = null;
    if (isStudent) {
      register_no = await ensureStudentRegisterNo(user);
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      roles: roleNames,
      ...(register_no && { register_no }),
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;