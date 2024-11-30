const admin = require('firebase-admin');

// Path to your Firebase service account key file
//const serviceAccount = require('./firebase.json');

const fs = require('fs');

// Load the Firebase service account file
const serviceAccount = JSON.parse(fs.readFileSync('/etc/secrets/firebase.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); // For Firestore
// const db = admin.database(); // For Firebase Realtime Database, if you use this

module.exports = { admin, db };