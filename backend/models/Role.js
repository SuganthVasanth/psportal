const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,

  is_system_role: {
    type: Boolean,
    default: false   // true for super_admin, admin, student
  },

  // permissions: [String]  // optional (future use)
});

module.exports = mongoose.model("Role", roleSchema);