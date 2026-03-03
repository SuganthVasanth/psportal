const mongoose = require('mongoose');

const newSessions = [
    { time: "Biometric - FN", shift: "Forenoon", status: "Present" },
    { time: "Biometric - AN", shift: "Afternoon", status: "Present" },
    { time: "08:45 Am to 09:35 Am", shift: "Forenoon", status: "Present", markedBy: "Training BIT" },
    { time: "09:35 Am to 10:25 Am", shift: "Forenoon", status: "Present", markedBy: "Training BIT" },
    { time: "10:40 Am to 11:30 Am", shift: "Forenoon", status: "Present", markedBy: "Training BIT" },
    { time: "11:30 Am to 12:20 Pm", shift: "Forenoon", status: "Present", markedBy: "Training BIT" },
    { time: "01:30 Pm to 02:20 Pm", shift: "Afternoon", status: "Present", markedBy: "Training BIT" },
    { time: "02:20 Pm to 03:10 Pm", shift: "Afternoon", status: "Present", markedBy: "Training BIT" },
    { time: "03:25 Pm to 04:25 Pm", shift: "Afternoon", status: "Present", markedBy: "Training BIT" }
];

async function updateAttendance() {
    await mongoose.connect('mongodb://localhost:27017/psportal');
    console.log("Connected to MongoDB");

    const Attendance = require('./models/Attendance');

    const allAttendances = await Attendance.find({});
    console.log(`Found ${allAttendances.length} attendance records.`);

    for (let doc of allAttendances) {
        if (doc.records && doc.records.length > 0) {
            for (let i = 0; i < doc.records.length; i++) {
                doc.records[i].sessions = newSessions;
            }

            doc.presentDays = doc.records.length;
            doc.absentDays = 0;
            doc.percentage = 100;

            await doc.save();
            console.log(`Updated attendance for student: ${doc.student_id}`);
        }
    }

    console.log("Update completed.");
    process.exit(0);
}

updateAttendance().catch(console.error);
