const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/psportal').then(async () => {
    const db = mongoose.connection;
    const collection = db.collection('users');

    await collection.updateOne(
        { email: 'suganth.cs23@bitsathy.ac.in' },
        {
            $set: {
                email: 'suganth.cs23@bitsathy.ac.in',
                roles: [new mongoose.Types.ObjectId('699e7cd3b0032041cb42566b')]
            }
        },
        { upsert: true }
    );

    await collection.updateOne(
        { email: 'suganthr500@gmail.com' },
        {
            $set: {
                email: 'suganthr500@gmail.com',
                roles: [new mongoose.Types.ObjectId('699e7cd3b0032041cb42566a')]
            }
        },
        { upsert: true }
    );

    console.log('Successfully assigned roles to users');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
