'use strict';
const admin = require('firebase-admin');
const path = require('path');

const KEY_PATH = path.join(__dirname, '..', 'secrets', 'serviceAccountKey.json');

if (!admin.apps.length) {
  const fs = require('fs');
  if (!fs.existsSync(KEY_PATH)) {
    console.error('❌ Ключ не знайдено: ' + KEY_PATH);
    console.error('   Firebase Console → ⚙️ Project settings → Service accounts → Generate new private key');
    console.error('   Збережи файл як secrets/serviceAccountKey.json');
    process.exit(1);
  }
  const serviceAccount = require(KEY_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

module.exports = { admin, db };
