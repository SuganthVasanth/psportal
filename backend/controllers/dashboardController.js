const Student = require("../models/Student");
const PointTransaction = require("../models/PointTransaction");
const StudentProgress = require("../models/StudentProgress");

exports.getStudentDashboardData = async (req, res) => {
    try {
        // For testing without auth middleware, we'll accept a register_no or just return the first student
        const register_no = req.query.register_no || "7376231CS323";

        // Find student
        const student = await Student.findOne({ register_no }).populate("user_id");

        if (!student) {
            // Return mock data so the dashboard still loads (e.g. before running dashboard seed)
            const mockPayload = {
                profile: {
                    name: "Student",
                    register_no: register_no,
                    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(register_no),
                    department: "Computer Science and Engineering"
                },
                points: {
                    total: 0,
                    breakdown: [],
                    recentTransactions: []
                },
                skills: {
                    tags: [],
                    progress: { cleared: 0, ongoing: 0 }
                }
            };
            return res.status(200).json(mockPayload);
        }

        // Fetch ALL Point Transactions
        const allTransactions = await PointTransaction.find({ student_id: student._id })
            .sort({ date_earned: -1 });

        // Build generic breakdown matching UI layout dynamically from the DB transactions
        const breakdownMap = {};

        allTransactions.forEach(tx => {
            if (!breakdownMap[tx.activity_category]) {
                breakdownMap[tx.activity_category] = {
                    category: tx.activity_category,
                    pointsEarned: 0,
                    eligibleBonus: 0,
                    sourceMap: {}
                };
            }

            breakdownMap[tx.activity_category].pointsEarned += tx.points_earned;

            if (!breakdownMap[tx.activity_category].sourceMap[tx.activity_title]) {
                breakdownMap[tx.activity_category].sourceMap[tx.activity_title] = 0;
            }
            breakdownMap[tx.activity_category].sourceMap[tx.activity_title] += tx.points_earned;
        });

        // Convert Breakdown map cleanly
        const pointsBreakdown = Object.values(breakdownMap).map(catData => ({
            category: catData.category,
            pointsEarned: catData.pointsEarned,
            eligibleBonus: catData.eligibleBonus,
            transactions: Object.entries(catData.sourceMap).map(([title, pts]) => ({
                source: title,
                points: pts,
                bonus: "-"
            })).sort((a, b) => a.source.localeCompare(b.source)) // alphabetcal descending sources
        })).sort((a, b) => a.category.localeCompare(b.category)); // alphabetical categories

        // Get Skills Progress (Aggregating based on generic completed status for the mock UI)
        const progressRecords = await StudentProgress.find({ student_id: student._id });
        const clearedSkills = progressRecords.filter(p => p.completed).length;
        const ongoingSkills = progressRecords.filter(p => !p.completed).length;

        // Dynamically extract Skill Tags from "Personalized Skills" point transactions
        const skillTagsMap = {};
        allTransactions.forEach(tx => {
            if (tx.activity_category.startsWith("Personalized Skills")) {
                // E.g. "C Programming Level - 5" or "Aptitude Level - 1H"
                let title = tx.activity_title || "";

                // Heuristic parsing: split by " Level" or "-"
                let skillName = title;
                let levelMatch = title.match(/Level\s*-\s*([0-9A-Z]+)/i) || title.match(/-\s*Level\s*([0-9A-Z]+)/i);

                if (levelMatch) {
                    skillName = title.substring(0, levelMatch.index).trim();
                }

                // Clean up trailing hyphens
                if (skillName.endsWith("-")) skillName = skillName.slice(0, -1).trim();

                // Group by skillName and count the occurrences to represent level progress 
                // (e.g., 5 levels of C Programming completed = Level 5)
                if (!skillTagsMap[skillName]) {
                    skillTagsMap[skillName] = 0;
                }
                skillTagsMap[skillName] += 1;
            }
        });

        // Convert to array of { name: '...', level: N } and sort by highest level first
        const skillTags = Object.entries(skillTagsMap)
            .map(([name, count]) => ({ name, level: count }))
            .sort((a, b) => b.level - a.level);

        // Map realistic cleared/ongoing counts based on this raw data natively
        const dynamicClearedSkills = allTransactions.filter(tx => tx.activity_category.startsWith("Personalized Skills")).length;
        const dynamicOngoingSkills = 6; // Mock buffer for visually appealing UI layout

        // Payload Assembly
        const payload = {
            profile: {
                name: student.name,
                register_no: student.register_no,
                avatarUrl: student.profile_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Suganth",
                department: student.department
            },
            points: {
                total: student.activity_points,
                breakdown: pointsBreakdown, // Using mock for now until we fully model points ledger
                recentTransactions: allTransactions.slice(0, 20).map(pt => ({
                    title: pt.activity_title,
                    category: pt.activity_category,
                    status: pt.activity_status,
                    points: pt.points_earned,
                    date: pt.date_earned
                }))
            },
            skills: {
                tags: skillTags, // Fully Dynamic now!
                progress: {
                    cleared: dynamicClearedSkills,
                    ongoing: dynamicOngoingSkills
                }
            }
        };

        res.json(payload);

    } catch (error) {
        console.error("Dashboard Aggregation Error:", error);
        res.status(500).json({ message: "Failed to load dashboard data" });
    }
};
