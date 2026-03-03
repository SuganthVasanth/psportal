const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const Course = require("../models/Course");
const CourseLevel = require("../models/CourseLevel");
const Student = require("../models/Student");
const StudentProgress = require("../models/StudentProgress");
const CourseLevelPrerequisite = require("../models/CourseLevelPrerequisite");

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding Courses");

        const courses = [
            { _id: 101, course_name: "Advanced Modelling & Simulation", total_levels: 2, course_category: "hardware" },
            { _id: 102, course_name: "Analog Electronics", total_levels: 15, course_category: "hardware" },
            { _id: 103, course_name: "Analog Electronics - Mock Test", total_levels: 25, course_category: "hardware" },
            { _id: 104, course_name: "Aptitude", total_levels: 14, course_category: "non-technical" }
        ];

        const courseLevels = [
            { _id: "ADV_MOD_L0", course_id: 101, level_number: 0, level_title: "Advanced Modelling & Simulation - Level 0", description: "Introduction to FEA, Mathematical Framework, and ANSYS Workflow", rewards: 100 },
            { _id: "AE_L1A", course_id: 102, level_number: 1, level_title: "Analog Electronics Level - 1A", description: "Selection of Current Limiting Resistors using basic Circuit Laws", rewards: 150 },
            // The user had a typo with 'level_id' in their JSON block, normalizing it to our primary `_id` field dynamically mapped
            { _id: "AE_MOCK_L5", course_id: 103, level_number: 5, level_title: "AE Mock Test 5 (Transistor Theory + BJT)", description: "Assessment covering Transistor Theory and BJT configurations", rewards: 50 },
            { _id: "APT_L1A", course_id: 104, level_number: 1, level_title: "Aptitude Level - 1A", description: "Number System, Ratio Proportion", rewards: 100 }
        ];

        const studentData = {
            _id: "S_7376231CS323",
            name: "SUGANTH R",
            register_no: "7376231CS323",
            profile_pic: "path/to/profile.jpg",
            activity_points: 1250,
            type: "hosteler"
        };

        const studentProgress = [
            { student_id: "S_7376231CS323", level_id: "APT_L1A", attempts: 8, completed: true, score: 95 },
            { student_id: "S_7376231CS323", level_id: "APT_L1B", attempts: 1, completed: true, score: 88 },
            { student_id: "S_7376231CS323", level_id: "AE_L1A", attempts: 0, completed: false, score: 0 }
        ];

        const prerequisites = [
            { level_id: "ADV_MOD_L1", prerequisite_level_id: "ADV_MOD_L0" },
            { level_id: "AE_L1B", prerequisite_level_id: "AE_L1A" },
            { level_id: "AE_L2.0", prerequisite_level_id: "AE_L1D" }
        ];

        console.log("Dropping existing course data...");
        await Course.deleteMany({});
        await CourseLevel.deleteMany({});
        await StudentProgress.deleteMany({});
        await CourseLevelPrerequisite.deleteMany({});

        // Force cleanup of obsolete auto-generated student accounts crashing standard queries
        const oldStudent = await Student.findOne({ register_no: "7376231CS323" });
        if (oldStudent && typeof oldStudent._id !== "string") {
            await Student.deleteMany({ register_no: "7376231CS323" });
        }

        console.log("Seeding core progression metrics...");
        await Course.insertMany(courses);
        await CourseLevel.insertMany(courseLevels);

        await Student.updateOne({ _id: studentData._id }, { $set: studentData }, { upsert: true });

        await StudentProgress.insertMany(studentProgress);
        await CourseLevelPrerequisite.insertMany(prerequisites);

        console.log("Successfully seeded courses, levels, and prerequisites records!");
        process.exit();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
