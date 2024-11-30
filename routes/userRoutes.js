const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { db } = require('../firebaseAdmin'); // Adjust the path as necessary

// GET users listing
router.get('/', function(req, res, next) {
    res.send('Respond with a resource: users');
});


router.post('/', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        // Check if an email already exists in the database
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (!snapshot.empty) {
            return res.status(409).json({ message: "Email already exists." });
        }

        // Proceed with hashing the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Add the new user with hashed password
        const docRef = await usersRef.add({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "User created successfully!", id: docRef.id });
    } catch (error) {
        res.status(500).json({ message: "Failed to create user", error: error.message });
    }
});



router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log("Received login request with email:", email);
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        // Retrieve user from Firestore by email
        const usersRef = db.collection('users');
        const querySnapshot = await usersRef.where('email', '==', email).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ message: "User not found." });
        }

        console.log("User found in Firestore.");

        // Assuming there is one unique user per email
        const userDoc = querySnapshot.docs[0];
        const { password: storedPassword, ...userWithoutPassword } = userDoc.data(); // Destructure to exclude password

        // Compare provided password with stored hashed password
        const match = await bcrypt.compare(password, storedPassword);
        console.log("Password comparison result:", match);

        if (match) {
            console.log("Login successful!");
            res.status(200).json({
                message: "Login successful!",
                user: { id: userDoc.id, ...userWithoutPassword } // Spread user details excluding password
            });
        } else {
            console.log("Invalid credentials.");
            res.status(401).json({ message: "Invalid credentials." });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;