const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const User = require("./models/User");
const Role = require("./models/Role");

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        const rolesMap = {
            "admin": await Role.findOne({ role_name: "admin" }),
            "student": await Role.findOne({ role_name: "student" })
        };

        const usersToSeed = [
            {
                name: "Student User",
                email: "suganth.cs23@bitsathy.ac.in",
                roles: rolesMap["student"] ? [rolesMap["student"]._id] : []
            },
            {
                name: "Admin User",
                email: "suganthr500@gmail.com",
                roles: rolesMap["admin"] ? [rolesMap["admin"]._id] : []
            },
            {
                name: "Admin User",
                email: "rsuganth98@gmail.com",
                roles: rolesMap["admin"] ? [rolesMap["admin"]._id] : []
            }
        ];

        for (let userData of usersToSeed) {
            await User.updateOne(
                { email: userData.email },
                { $set: userData },
                { upsert: true }
            );
            console.log(`Upserted user: ${userData.email}`);
        }

        console.log("Users seeded successfully");
    } catch (error) {
        console.error("Error seeding users:", error);
    } finally {
        process.exit();
    }
}

seedUsers();
