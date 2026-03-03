const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/psportal').then(async () => {
    const User = require('./models/User');
    const Role = require('./models/Role');

    const superAdminRole = await Role.findOne({ role_name: 'super_admin' });
    const adminRole = await Role.findOne({ role_name: 'admin' });

    const pullQuery = {};
    if (superAdminRole && adminRole) {
        pullQuery.$pullAll = { roles: [superAdminRole._id, adminRole._id] };
    } else if (superAdminRole) {
        pullQuery.$pull = { roles: superAdminRole._id };
    } else if (adminRole) {
        pullQuery.$pull = { roles: adminRole._id };
    }

    if (pullQuery.$pull || pullQuery.$pullAll) {
        const res = await User.updateOne(
            { email: 'suganth.cs23@bitsathy.ac.in' },
            pullQuery
        );
        console.log('Removed roles from user:', res);
    } else {
        console.log('Roles not found in DB');
    }

    const user = await User.findOne({ email: 'suganth.cs23@bitsathy.ac.in' }).populate('roles');
    console.log('Current roles for user:', user.roles.map(r => r.role_name));

    process.exit(0);
});
