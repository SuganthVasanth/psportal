require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Role = require("./models/Role");

async function removeRole() {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email: "suganth.cs23@bitsathy.ac.in" }).populate("roles");
    if (user) {
        const saRole = await Role.findOne({ role_name: "super_admin" });
        if (saRole) {
            user.roles = user.roles.filter(r => r._id.toString() !== saRole._id.toString());
            await user.save();
            console.log("Successfully removed super_admin role from " + user.email);
        } else {
            console.log("super_admin role not found in DB.");
        }
    } else {
        console.log("User not found.");
    }
    process.exit(0);
}

removeRole();
