const fs = require('fs');
const files = [
    'd:/VS CODE/Web Development/psportal/psportal/backend/controllers/superadminController.js',
    'd:/VS CODE/Web Development/psportal/psportal/backend/controllers/studentCourseController.js',
    'd:/VS CODE/Web Development/psportal/psportal/backend/controllers/questionBankController.js'
];
files.forEach(f => {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/new:\s*true/g, "returnDocument: 'after'");
    fs.writeFileSync(f, text);
    console.log('Fixed', f);
});
