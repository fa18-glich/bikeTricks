'use strict';
// Використання: node scripts/getUser.js <uid>
// Показує документ користувача з Firestore.
const { db } = require('./firebase');

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('❌ Вкажи UID: node scripts/getUser.js <uid>');
    process.exit(1);
  }
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) {
    console.log('❌ Користувач ' + uid + ' не знайдений');
    process.exit(0);
  }
  console.log('UID:', uid);
  console.log(JSON.stringify(doc.data(), null, 2));
}

main().catch(e => { console.error('Помилка:', e.message); process.exit(1); });
