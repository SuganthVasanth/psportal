const MovementPass = require('../models/MovementPass');
const Student = require('../models/Student');

// Helper to convert time string (e.g., "10:30" or "14:45") to minutes since midnight
const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    // If it's a simple HH:MM format
    if (timeStr.includes(':')) {
        let [hours, minutes] = timeStr.split(':');
        if (minutes === undefined) minutes = '0';

        // Handle AM/PM if present
        if (minutes.toLowerCase && minutes.toLowerCase().includes('pm')) {
            hours = parseInt(hours, 10) || 0;
            if (hours !== 12) hours += 12;
            minutes = minutes.toLowerCase().replace('pm', '').trim();
        } else if (minutes.toLowerCase && minutes.toLowerCase().includes('am')) {
            hours = parseInt(hours, 10) || 0;
            if (hours === 12) hours = 0;
            minutes = minutes.toLowerCase().replace('am', '').trim();
        }

        const h = parseInt(hours, 10) || 0;
        const m = parseInt(minutes, 10) || 0;
        return h * 60 + m;
    }
    return 0;
};

// Helper to format minutes back to string
const minutesToTimeStr = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const hoursStr = hours < 10 ? '0' + hours : hours;

    return `${hoursStr}:${minutesStr} ${ampm}`;
};

// Helper to determine session based on start time
const getSession = (timeStr) => {
    const minutes = timeToMinutes(timeStr);
    // Forenoon is before 12:00 PM (720 minutes)
    return minutes < 720 ? 'forenoon' : 'afternoon';
};

exports.createPass = async (req, res) => {
    try {
        const { student_id, startTime, purpose } = req.body;

        if (!student_id || !startTime || !purpose) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify Student exists
        const student = await Student.findById(student_id);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const session = getSession(startTime);

        // Calculate the boundaries for today to check existing passes
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Check limits
        const existingPasses = await MovementPass.countDocuments({
            student_id,
            session,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingPasses >= 2) {
            return res.status(400).json({
                message: `Limit exceeded. You can only create 2 passes per ${session} session.`
            });
        }

        // Calculate end time (start time + 20 minutes)
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = startMinutes + 20;

        // Let's format startTime consistently as HH:MM AM/PM as well, so it matches the frontend layout nicely
        const formattedStartTime = minutesToTimeStr(startMinutes);
        const formattedEndTime = minutesToTimeStr(endMinutes);

        // For determining initial status based on current real-time
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const status = currentTotalMinutes > endMinutes ? 'Expired' : 'Active';

        const newPass = await MovementPass.create({
            student_id,
            date: now,
            startTime: formattedStartTime,
            endTime: formattedEndTime,
            purpose,
            session,
            status
        });

        res.status(201).json({ message: "Movement pass created successfully", pass: newPass });

    } catch (error) {
        console.error("Error creating movement pass:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getPasses = async (req, res) => {
    try {
        const { student_id } = req.params;

        if (!student_id) {
            return res.status(400).json({ message: "Student ID required" });
        }

        // Fetch all passes, sorted descending by creation time (lean to avoid save() issues)
        const passes = await MovementPass.find({ student_id }).sort({ createdAt: -1 }).lean();

        const now = new Date();
        const todayStr = now.toDateString();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        // Compute status in memory only (no DB writes on read) to avoid 500s from save()
        const updatedPasses = passes.map((pass) => {
            const status = pass.status || 'Active';
            if (status === 'Expired') return { ...pass, status: 'Expired' };

            const passDate = pass.date ? new Date(pass.date) : null;
            if (!passDate || passDate.toDateString() !== todayStr) {
                return { ...pass, status: 'Expired' };
            }

            const endTimeStr = pass.endTime || '';
            const expireMinutes = timeToMinutes(endTimeStr);
            if (currentTotalMinutes >= expireMinutes) {
                return { ...pass, status: 'Expired' };
            }

            return { ...pass, status: 'Active' };
        });

        res.status(200).json(updatedPasses);

    } catch (error) {
        console.error("Error fetching movement passes:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
