require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Role = require("./models/Role");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "suganth.cs23@bitsathy.ac.in" }).populate("roles");
    if (user) {
        console.log("Roles for " + user.email + ":");
        user.roles.forEach(r => console.log("- " + r.role_name));
    } else {
        console.log("User not found.");
    }
    process.exit(0);
}

check();
