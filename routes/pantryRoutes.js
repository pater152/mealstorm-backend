const express = require('express');
const router = express.Router();

const { db } = require('../firebaseAdmin'); // Adjust the path as necessary

// GET endpoint to retrieve pantry items by UserObjectId
router.get('/', async (req, res) => {
    const userObjectId = req.query.userObjectId; // or req.headers['user-object-id'] if passed in the header

    if (!userObjectId) {
        return res.status(400).json({ message: "UserObjectId is required" });
    }

    try {
        const pantryItemsRef = db.collection('pantryItems');
        const snapshot = await pantryItemsRef.where('UserObjectId', '==', userObjectId).get();

        let pantryItems = [];
        snapshot.forEach(doc => {
            pantryItems.push({ id: doc.id, ...doc.data() });
        });

        // Return an empty array if no pantry items are found
        res.json(pantryItems);
    } catch (error) {
        console.error('Failed to retrieve pantry items:', error);
        res.status(500).json({ message: 'Failed to retrieve pantry items', error: error.message });
    }
});

// GET endpoint to retrieve a pantry item by ID with user verification
router.get('/:id', async (req, res) => {
    const { id } = req.params;  // Extract the pantry item ID from the request URL
    const userObjectIdFromHeader = req.headers.userobjectid; // Extract UserObjectId from the request headers

    try {
        // Fetch the pantry item document from the 'pantryItems' collection
        const docRef = db.collection('pantryItems').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Pantry item not found." });
        }

        const pantryItemData = doc.data();

        // Check if the UserObjectId from the header matches the one in the document
        if (pantryItemData.UserObjectId !== userObjectIdFromHeader) {
            return res.status(403).json({ message: "Unauthorized access to the pantry item." });
        }

        // User verification passed, send back the pantry item data
        res.status(200).json(pantryItemData);

    } catch (error) {
        // Handle possible errors
        res.status(500).json({ message: "Failed to retrieve pantry item", error: error.message });
    }
});


// POST endpoint to add a new pantry item
router.post('/', async (req, res) => {
    const { ItemName, Quantity, UserObjectId } = req.body;

    // Basic validation to ensure all required fields are present
    if (!ItemName || Quantity == null || !UserObjectId) {
        return res.status(400).json({ message: "All fields are required: ItemName, Quantity, and UserObjectId." });
    }

    try {
        // Add a new document in the 'pantryItems' collection
        const docRef = await db.collection('pantryItems').add({
            ItemName,
            Quantity,
            UserObjectId
        });

        // Respond with the ID of the created document
        res.status(201).json({ message: "Pantry item added successfully!", id: docRef.id });
    } catch (error) {
        // Handle possible errors
        res.status(500).json({ message: "Failed to add pantry item", error: error.message });
    }
});


// PUT endpoint to update a pantry item
router.put('/:id', async (req, res) => {
    const { id } = req.params; // PantryId from the URL
    const { ItemName, Quantity, UserObjectId } = req.body;

    if (!ItemName || Quantity == null) {
        return res.status(400).json({ message: "ItemName and Quantity must be provided." });
    }

    try {
        const docRef = db.collection('pantryItems').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Pantry item not found." });
        }

        // Check if the UserObjectId from the request matches the one in the document
        if (doc.data().UserObjectId !== UserObjectId) {
            return res.status(403).json({ message: "Unauthorized access to update pantry item." });
        }

        // Proceed with updating the item
        await docRef.update({
            ItemName,
            Quantity
        });

        res.status(200).json({ message: "Pantry item updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to update pantry item", error: error.message });
    }
});

// DELETE endpoint to remove a pantry item
router.delete('/:id', async (req, res) => {
    const { id } = req.params; // PantryId from the URL
    const userObjectIdFromHeader = req.headers.userobjectid; // Extract UserObjectId from the request headers

    try {
        const docRef = db.collection('pantryItems').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: "Pantry item not found." });
        }

        // Check if the UserObjectId from the header matches the one in the document
        if (doc.data().UserObjectId !== userObjectIdFromHeader) {
            return res.status(403).json({ message: "Unauthorized access to delete pantry item." });
        }

        // Proceed with deleting the item
        await docRef.delete();

        res.status(200).json({ message: "Pantry item deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete pantry item", error: error.message });
    }
});

module.exports = router;