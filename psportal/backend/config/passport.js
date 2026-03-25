const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

// Must match Google Cloud Console → Authorized redirect URI exactly (no trailing slash).
// Also add http://127.0.0.1:5000/auth/google/callback in Console if you ever open the API via 127.0.0.1.
const callbackURL = "http://127.0.0.1:5000/auth/google/callback";
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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // eslint-disable-next-line no-console
  console.log("Configured Callback URL:", callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        // eslint-disable-next-line no-console
        console.log("ACTUAL CALLBACK HIT:", req.originalUrl);
        // eslint-disable-next-line no-console
        console.log("HOST:", req.headers.host);
        // eslint-disable-next-line no-console
        console.log("PROTOCOL:", req.protocol);

        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false);
          }

          let user = await User.findOne({ email }).populate("roles");
          if (!user) {
            return done(null, false);
          }

          const sub = profile.id;
          if (!user.google_id) {
            user.google_id = sub;
            user.name = profile.displayName || user.name;
            await user.save();
          }

          const roleNames = (user.roles || []).map(
            (r) => (r && r.role_name) || (typeof r === "string" ? r : "")
          );
          const isStudent = roleNames.some((r) => String(r || "").toLowerCase() === "student");
          if (isStudent) {
            await ensureStudentRegisterNo(user);
          }

          const token = jwt.sign(
            { userId: user._id, roles: roleNames, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
          );

          return done(null, { token });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn("Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable.");
}

module.exports = passport;
