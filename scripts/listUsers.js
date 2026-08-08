'use strict';
// Використання: node scripts/listUsers.js [limit]
// Показує UID + нікнейм + XP користувачів із лідерборда.
const { db } = require('./firebase');

async function main() {
  const limit = parseInt(process.argv[2] || '20', 10);
  const snap = await db.collection('leaderboard').orderBy('pts', 'desc').limit(limit).get();
  if (snap.empty) {
    console.log('Лідерборд порожній');
    return;
  }
  snap.docs.forEach((d, i) => {
    const u = d.data();
    console.log(String(i + 1).padStart(3), '|', (u.nickname || '—').padEnd(24), '|', (u.pts || 0) + ' XP', '|', u.uid);
  });
}

main().catch(e => { console.error('Помилка:', e.message); process.exit(1); });
