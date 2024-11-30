const admin = require('firebase-admin');

// Path to your Firebase service account key file
const serviceAccount = require('./firebase.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // For Firestore
// const db = admin.database(); // For Firebase Realtime Database, if you use this

module.exports = { admin, db };