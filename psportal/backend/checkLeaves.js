const mongoose = require('mongoose');
const Leave = require('./models/Leave');
const LeaveWorkflow = require('./models/LeaveWorkflow');

async function run() {
    await mongoose.connect('mongodb://localhost:27017/psportal');

    const workflows = await LeaveWorkflow.find().lean();
    console.log('Workflows:');
    console.log(JSON.stringify(workflows, null, 2));

    const leaves = await Leave.find().sort({ createdAt: -1 }).limit(5).lean();
    console.log('\nRecent Leaves:');
    console.log(JSON.stringify(leaves, null, 2));

    process.exit(0);
}

run().catch(console.error);
