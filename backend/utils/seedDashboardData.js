const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config({ path: "../.env" });

// Models
const Student = require("../models/Student");
const PointTransaction = require("../models/PointTransaction");
const StudentProgress = require("../models/StudentProgress");

const seedDashboard = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding Dashboard");

        // Clear existing dashboard mock data
        await Student.deleteMany({ register_no: "7376231CS323" });

        // 1. Create a mock Student linked to a fake user_id just for testing schema integrity
        // In a real app the User model handles Auth, but here we can just dummy a 24-char hex string
        const mockUserId = new mongoose.Types.ObjectId();

        const newStudent = await Student.create({
            _id: "S_7376231CS323",
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

        // 2. Create Point Transactions exactly matching the complete Points Breakdown
        const transactionsToInsert = [
            // Academics (T, L)
            { student_id: newStudent._id, activity_category: "Academics (T, L)", activity_title: "Mentor - CSE - MENTORCSE - S6 - MENTOR MEETING", points_earned: 30, date_earned: new Date("2026-02-03T16:25:00") },

            // Certification Courses
            { student_id: newStudent._id, activity_category: "Certification Courses", activity_title: "AI Agentforce Certification", points_earned: 1500, date_earned: new Date("2026-01-01T10:00:00") },

            // External Events
            { student_id: newStudent._id, activity_category: "External Events", activity_title: "SUSTAINABLE TECHNOLOGY DEVELOPMENT", points_earned: 600, date_earned: new Date("2026-01-29T10:21:00") },

            // Personalized Skills - Non Technical
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1A", points_earned: 100, date_earned: new Date("2025-10-01T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1B", points_earned: 100, date_earned: new Date("2025-10-02T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1C", points_earned: 100, date_earned: new Date("2025-10-03T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1E", points_earned: 100, date_earned: new Date("2025-10-04T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1H", points_earned: 100, date_earned: new Date("2025-10-05T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Non Technical", activity_title: "Aptitude Level - 1I", points_earned: 100, date_earned: new Date("2025-10-06T10:00:00") },

            // Personalized Skills - Technical
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 1", points_earned: 300, date_earned: new Date("2025-11-01T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 2", points_earned: 600, date_earned: new Date("2025-11-02T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 3A", points_earned: 900, date_earned: new Date("2025-11-03T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 4", points_earned: 900, date_earned: new Date("2025-11-04T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "C Programming Level - 5", points_earned: 900, date_earned: new Date("2025-11-05T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Database Programming Level - 1", points_earned: 300, date_earned: new Date("2025-11-06T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Database Programming Level - 2", points_earned: 300, date_earned: new Date("2025-11-07T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Database Programming Level - 3", points_earned: 300, date_earned: new Date("2025-11-08T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Linux Level - 0", points_earned: 100, date_earned: new Date("2025-11-09T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming C++ - Level 2", points_earned: 600, date_earned: new Date("2025-11-10T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming C++ Level - 1", points_earned: 300, date_earned: new Date("2025-11-11T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Java Level - 1", points_earned: 300, date_earned: new Date("2025-11-12T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Java Level - 2", points_earned: 600, date_earned: new Date("2025-11-13T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Java Level - 3", points_earned: 900, date_earned: new Date("2025-11-14T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Python Level - 1", points_earned: 150, date_earned: new Date("2025-11-15T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Python Level - 2", points_earned: 300, date_earned: new Date("2025-11-16T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Python Level - 3", points_earned: 400, date_earned: new Date("2025-11-17T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "Programming Python Level - 4", points_earned: 450, date_earned: new Date("2025-11-18T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "UI/UX Level - 2", points_earned: 600, date_earned: new Date("2025-11-19T10:00:00") },
            { student_id: newStudent._id, activity_category: "Personalized Skills - Technical", activity_title: "UI/UX Level -1", points_earned: 300, date_earned: new Date("2025-11-20T10:00:00") },

            // SSG (Combined recent entries & history for accurate totals)
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 40, date_earned: new Date("2026-02-04T16:25:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-04T15:10:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-03T15:10:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-03T12:20:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-03T10:20:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 40, date_earned: new Date("2026-02-02T16:25:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-02T15:10:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-02T12:20:00"), description: "PBL CSE - 2024-2028 batch" },
            { student_id: newStudent._id, activity_category: "SSG", activity_title: "SSG - SSG CSE - 2024-2028 bacth", points_earned: 80, date_earned: new Date("2026-02-02T10:20:00"), description: "PBL CSE - 2024-2028 batch" },

            // T&P Training
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - Workhall placement drive", points_earned: 20, date_earned: new Date("2026-02-05T09:05:00"), description: "Workhall placement drive" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - Workhall placement drive", points_earned: 40, date_earned: new Date("2026-02-04T09:20:00"), description: "Workhall placement drive" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - Workhall placement drive", points_earned: 80, date_earned: new Date("2025-12-01T09:00:00") }, // Filler to hit 140 total
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - HCL Training", points_earned: 420, date_earned: new Date("2025-12-05T09:00:00") },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 60, date_earned: new Date("2026-01-31T16:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 80, date_earned: new Date("2026-01-31T12:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 60, date_earned: new Date("2026-01-30T16:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 80, date_earned: new Date("2026-01-30T12:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 60, date_earned: new Date("2026-01-29T16:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 80, date_earned: new Date("2026-01-29T12:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 60, date_earned: new Date("2026-01-28T16:20:00"), description: "HCL Training" },
            { student_id: newStudent._id, activity_category: "T&P Training", activity_title: "Placement - External Training", points_earned: 1840, date_earned: new Date("2025-12-10T10:00:00") } // Filler to reach 2320
        ];

        await PointTransaction.insertMany(transactionsToInsert);

        // Ensure student has accurate total dynamically calculated
        const totalPoints = transactionsToInsert.reduce((sum, t) => sum + t.points_earned, 0);
        await Student.updateOne({ _id: newStudent._id }, { activity_points: totalPoints });

        console.log(`Seeded ${transactionsToInsert.length} Point Transactions! Total Points: ${totalPoints}`);

        console.log("Seeding Complete. Exiting.");
        process.exit();
    } catch (error) {
        fs.writeFileSync("seed_error.txt", error.stack || error.toString());
        process.exit(1);
    }
};

seedDashboard();
