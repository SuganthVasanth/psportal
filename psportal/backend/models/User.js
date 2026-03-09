// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   name: String,
//   email: { 
//     type: String,
//     unique: true },
//   password: String,

//   role: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Role"
//   }
// });

// module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true
  },
  password: { type: String, select: false }, // for email/password login; not returned by default
  google_id: String,
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role"
  }]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);