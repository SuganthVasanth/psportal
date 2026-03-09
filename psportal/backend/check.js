const mongoose = require('mongoose');
const Student = require('./models/Student');
const User = require('./models/User'); // Load User schema

async function run() {
    await mongoose.connect('mongodb://localhost:27017/psportal');
    const students = await Student.find({
        $or: [{ mentor_id: { $ne: null } }, { warden_id: { $ne: null } }]
    }).populate('mentor_id', 'name email').populate('warden_id', 'name email');

    console.log('Mapped students:');
    console.log(JSON.stringify(students.map(s => ({
        name: s.name,
        register_no: s.register_no,
        mentor: s.mentor_id ? s.mentor_id.name + ' (' + s.mentor_id.email + ')' : 'None',
        warden: s.warden_id ? s.warden_id.name + ' (' + s.warden_id.email + ')' : 'None'
    })), null, 2));

    process.exit(0);
}

run().catch(console.error);
