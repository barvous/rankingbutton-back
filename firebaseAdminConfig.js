require('dotenv').config();
const admin = require('firebase-admin');

// Decodifica a variável de ambiente em Base64
const saJson = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '',
  'base64'
).toString('utf-8');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não está definida');
}

// Inicializa o Firebase Admin SDK **apenas uma vez**
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(saJson))
});

module.exports = admin;
