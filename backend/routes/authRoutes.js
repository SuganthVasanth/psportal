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
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");
require("dotenv").config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // 🚀 BOOTSTRAP SUPER ADMIN
    if (email === "suganth.cs23@bitsathy.ac.in") {
      let saRole = await Role.findOne({ role_name: "super_admin" });
      if (!saRole) {
        saRole = await Role.create({
          role_name: "super_admin",
          description: "System Super Admin",
          is_system_role: true
        });
      }

      // Check if they already have it
      if (!user.roles.some(r => r._id && r._id.toString() === saRole._id.toString())) {
        user.roles.push(saRole._id);
        await user.save();

        // Re-populate to get the new role objects
        user = await user.populate("roles");
      }
    }

    // 🚀 BOOTSTRAP ADMIN
    if (email === "rsuganth98@gmail.com") {
      let adminRole = await Role.findOne({ role_name: "admin" });
      if (!adminRole) {
        adminRole = await Role.create({
          role_name: "admin",
          description: "System Admin",
          is_system_role: true
        });
      }

      // Check if they already have it
      if (!user.roles.some(r => r._id && r._id.toString() === adminRole._id.toString())) {
        user.roles.push(adminRole._id);
        await user.save();

        // Re-populate to get the new role objects
        user = await user.populate("roles");
      }
    }

    const roleNames = user.roles.map(r => r.role_name);

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