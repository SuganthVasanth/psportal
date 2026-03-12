const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/.env" });
const AdminCourse = require("./models/AdminCourse");
const fs = require("fs");
const path = require("path");

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Seeding AdminCourses");

        // Read the JSON file
        const dataPath = path.join(__dirname, "data", "courses-inserted.json");
        const rawData = fs.readFileSync(dataPath, "utf8");
        const courses = JSON.parse(rawData);

        console.log(`Loaded ${courses.length} courses from JSON.`);

        // Clean up data to match AdminCourse schema exactly
        const formattedCourses = courses.map((course) => {
            return {
                name: course.name,
                description: course.description || "",
                status: course.status || "Active",
                type: course.type || "Technical",
                course_logo: course.course_logo || "https://ps.bitsathy.ac.in/api/ps_v2/images/courses/5.png",
                level: course.level ? "True" : "",
                activity_points: course.activity_points || 0,
                reward_points: course.reward_points || 0,
                faculty: course.faculty || null,
                levels: (course.levels || []).map(lvl => ({
                    name: lvl.name,
                    rewardPoints: lvl.rewardPoints || 0,
                    prerequisiteLevelIndex: typeof lvl.prerequisiteLevelIndex === 'number' ? lvl.prerequisiteLevelIndex : -1,
                    prerequisiteLevelIndices: lvl.prerequisiteLevelIndices || [],
                    assessmentType: lvl.assessmentType || "MCQ",
                    topics: lvl.topics || [],
                    prerequisiteCourses: lvl.prerequisiteCourses || []
                }))
            };
        });

        // Insert the formatted courses
        const inserted = await AdminCourse.insertMany(formattedCourses);
        console.log(`Successfully seeded ${inserted.length} AdminCourses!`);

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
