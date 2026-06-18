require('dotenv').config({ path: '/Users/hongocgiahan/LẬP TRÌNH THIẾT BỊ DI ĐỘNG/Iiawak/Iiawak_backend/.env' });
const mongoose = require('mongoose');
const User = require('/Users/hongocgiahan/LẬP TRÌNH THIẾT BỊ DI ĐỘNG/Iiawak/Iiawak_backend/src/3_DataAccess/Models/User.model');

async function testDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/iiawak');
  const user = await User.findOne({});
  console.log('--- USER DB DUMP ---');
  console.log('Username:', user.username);
  console.log('CheckedInDays (raw):', user.checkedInDays);
  console.log('KchBalance:', user.kchBalance);
  process.exit(0);
}

testDB().catch(console.error);
