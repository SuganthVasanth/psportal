const mongoose = require('mongoose');
const Leave = require('./models/Leave');

async function fixLeaves() {
    try {
        await mongoose.connect('mongodb://localhost:27017/psportal');
        console.log('Connected to DB. Fixing leaves...');
        const result = await Leave.updateMany(
            { status: 'Pending', 'mentorApproval.status': 'Approved', 'wardenApproval.status': 'Approved' },
            { $set: { status: 'Approved' } }
        );
        console.log(`Updated ${result.modifiedCount} stuck leaves to Approved`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fixLeaves();
