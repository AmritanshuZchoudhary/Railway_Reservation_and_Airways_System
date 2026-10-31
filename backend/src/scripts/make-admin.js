require('dotenv').config();
const db = require('../config/db');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: npm run make-admin -- student@example.com');
    process.exitCode = 1;
    return;
  }
  const [result] = await db.query("UPDATE users SET role = 'ADMIN' WHERE email = ?", [email]);
  if (result.affectedRows === 0) {
    console.error('No account was updated. Register with that email first and retry.');
    process.exitCode = 1;
  } else {
    console.log(`Administrator role granted to ${email}. Keep this local admin operation private.`);
  }
}
main().catch((error) => { console.error('Could not promote account:', error.message); process.exitCode = 1; }).finally(async () => db.end());
