const mongoose = require("mongoose");
require("dotenv").config();

// Models
const Student = require("./models/Student");
const PointTransaction = require("./models/PointTransaction");
const StudentProgress = require("./models/StudentProgress");

const seedDashboard = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Seeding Dashboard");

        // Clear existing dashboard mock data
        await Student.deleteMany({ register_no: "7376231CS323" });

        // 1. Create a mock Student linked to a fake user_id just for testing schema integrity
        // In a real app the User model handles Auth, but here we can just dummy a 24-char hex string
        const mockUserId = new mongoose.Types.ObjectId();

        const newStudent = await Student.create({
            user_id: mockUserId,
            student_id: "STU-001",
            name: "SUGANTH R",
            register_no: "7376231CS323",
            profile_pic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth",
            activity_points: 15750,
            department: "Computer Science and Engineering",
            type: "dayscholar"
        });

        console.log("Seeded Student:", newStudent.name);

        // Clear transactions
        await PointTransaction.deleteMany({ student_id: newStudent._id });

        // 2. Create Point Transactions exactly matching the screenshot
        const transactionsToInsert = [
            {
                student_id: newStudent._id,
                activity_title: "Placement - Workhall placement drive",
                activity_category: "T&P Training",
                activity_status: "Completed",
                points_earned: 20,
                date_earned: new Date("2026-02-05T08:05:00")
            },
            {
                student_id: newStudent._id,
                activity_title: "SSG - SSG CSE - 2024-2028 batch",
                activity_category: "SSG",
                activity_status: "Completed",
                points_earned: 40,
                date_earned: new Date("2026-02-04T16:25:00")
            },
            {
                student_id: newStudent._id,
                activity_title: "SUSTAINABLE TECHNOLOGY DEVELOPMENT",
                activity_category: "External Events",
                activity_status: "Completed",
                points_earned: 600,
                date_earned: new Date("2026-01-29T10:21:00")
            }
        ];

        await PointTransaction.insertMany(transactionsToInsert);
        console.log("Seeded Point Transactions!");

        console.log("Seeding Complete. Exiting.");
        process.exit();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedDashboard();
