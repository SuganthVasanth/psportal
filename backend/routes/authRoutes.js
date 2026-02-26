// const express = require("express");
// const router = express.Router();
// const passport = require("passport");

// // Google login
// router.get(
//   "/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// // Google callback
// router.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false }),
//   (req, res) => {
//     const token = req.user.token;

//     res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
//   }
// );

// module.exports = router;
const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
require("dotenv").config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: roleNames,
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
      return res.status(403).json({
        message: "Your email is not registered. Sign in with email/password if you have an account, or contact your administrator."
      });
    } else {
      // If user was a placeholder (pre-assigned role), they won't have a google_id or name yet
      if (!user.google_id) {
        user.google_id = sub;
        user.name = name;
        await user.save();
      }
    }

    const roleNames = (user.roles || []).map(r => r.role_name);

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
        roles: roleNames
      }
    });

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid Google Token" });
  }
});

module.exports = router;