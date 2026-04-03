const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function explore() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/psportal');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('--- Database Collections ---');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documents`);
      
      if (col.name.includes('question') || col.name.includes('problem') || col.name.includes('submission')) {
         const sample = await db.collection(col.name).findOne({});
         if (sample) {
           console.log(`  Sample: ${JSON.stringify({ _id: sample._id, title: sample.title, name: sample.name, course: sample.course_id || sample.courseId, status: sample.status }, null, 2)}`);
         }
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

explore();
