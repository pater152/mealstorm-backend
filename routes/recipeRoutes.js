const express = require('express');
const axios = require('axios'); // Import axios for making HTTP requests
const { db, FieldValue, admin } = require('../firebaseAdmin'); // Adjust the path as necessary
const router = express.Router();

// Spoonacular API key (consider using environment variables for sensitive data)
const SPOONACULAR_API_KEY = '48d5e5cbf7384db2b5607d2e03c0025a';

// GET endpoint to retrieve recipes based on pantry items
router.get('/', async (req, res) => {
    console.log("getting all")
    const userObjectId = req.query.userObjectId; // Get UserObjectId from query parameters
    const maxResults = req.query.maxResults || 5; // Get max number of recipes to return, default to 5

    if (!userObjectId) {
        return res.status(400).json({ message: "UserObjectId is required" });
    }

    try {
        // Fetch pantry items for the user
        const pantryItemsRef = db.collection('pantryItems');
        const snapshot = await pantryItemsRef.where('UserObjectId', '==', userObjectId).get();

        let ingredients = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            ingredients.push(data.ItemName); // Collect item names as ingredients
        });

        if (ingredients.length === 0) {
            return res.status(404).json({ message: "No pantry items found for this user." });
        }

        // Prepare the ingredients string for the API request
        const ingredientsString = ingredients.join(',');

        // Make a request to the Spoonacular API
        const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients`, {
            params: {
                ingredients: ingredientsString,
                number: maxResults,
                ranking: 1,
                ignorePantry: true,
            },
            headers: {
                'x-api-key': SPOONACULAR_API_KEY,
            },
        });

        // Return the recipes found
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Failed to fetch recipes', error: error.message });
    }
});


router.get('/:id', async (req, res) => {
    console.log("HelloThere in recipie")
    const recipeId = req.params.id; // Get the recipe ID from the URL
    const includeNutrition = req.query.includeNutrition === 'true'; // Get the includeNutrition parameter

    try {
        // Make a request to the Spoonacular API for recipe information
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: {
                includeNutrition: true,
                addWinePairing: true
            },
            headers: {
                'x-api-key': SPOONACULAR_API_KEY,
            },
        });

        // Return the recipe information found
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching recipe information:', error);
        res.status(500).json({ message: 'Failed to fetch recipe information', error: error.message });
    }
});


// POST endpoint to add a recipe to user's favorites
router.post('/favorites', async (req, res) => {
    const { userObjectId, recipeId } = req.body; // Get userObjectId and recipeId from request body

    if (!userObjectId || !recipeId) {
        return res.status(400).json({ message: "UserObjectId and RecipeId are required" });
    }

    try {
        const userFavoritesRef = db.collection('userFavorites').doc(userObjectId);
        const userFavoritesDoc = await userFavoritesRef.get();

        if (userFavoritesDoc.exists) {
            // If the document exists, update the favoriteRecipes array
            await userFavoritesRef.update({
                favoriteRecipes: admin.firestore.FieldValue.arrayUnion(recipeId) // Add recipeId to the array
            });
        } else {
            // If the document does not exist, create it with the recipeId
            await userFavoritesRef.set({
                favoriteRecipes: [recipeId] // Initialize with the first recipeId
            });
        }

        res.status(200).json({ message: 'Recipe added to favorites!' });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({ message: 'Failed to add recipe to favorites', error: error.message });
    }
});

// DELETE endpoint to remove a recipe from user's favorites
router.delete('/favorites', async (req, res) => {
    const { userObjectId, recipeId } = req.body; // Get userObjectId and recipeId from request body

    if (!userObjectId || !recipeId) {
        return res.status(400).json({ message: "UserObjectId and RecipeId are required" });
    }

    try {
        const userFavoritesRef = db.collection('userFavorites').doc(userObjectId);
        const userFavoritesDoc = await userFavoritesRef.get();

        if (userFavoritesDoc.exists) {
            // If the document exists, update the favoriteRecipes array
            await userFavoritesRef.update({
                favoriteRecipes: admin.firestore.FieldValue.arrayRemove(recipeId) // Remove recipeId from the array
            });
            res.status(200).json({ message: 'Recipe removed from favorites!' });
        } else {
            res.status(404).json({ message: 'User favorites not found.' });
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({ message: 'Failed to remove recipe from favorites', error: error.message });
    }
});

// GET endpoint to retrieve user's favorite recipes
router.get('/favorites/:userObjectId', async (req, res) => {
    const userObjectId = req.params.userObjectId; // Get UserObjectId from URL parameters

    if (!userObjectId) {
        return res.status(400).json({ message: "UserObjectId is required" });
    }

    try {
        const userFavoritesRef = db.collection('userFavorites').doc(userObjectId);
        const userFavoritesDoc = await userFavoritesRef.get();

        if (userFavoritesDoc.exists) {
            const userFavoritesData = userFavoritesDoc.data();
            const favoriteRecipes = userFavoritesData.favoriteRecipes || []; // Get the favoriteRecipes array

            // Optionally, you can fetch detailed recipe information from an external API if needed
            // For now, we will just return the recipe IDs
            res.status(200).json({ favoriteRecipes });
        } else {
            res.status(404).json({ message: 'User favorites not found.' });
        }
    } catch (error) {
        console.error('Error fetching favorite recipes:', error);
        res.status(500).json({ message: 'Failed to fetch favorite recipes', error: error.message });
    }
});

// ... existing code ...

// GET endpoint to retrieve detailed information of user's favorite recipes
router.get('/favorites/details/:userObjectId', async (req, res) => {
    const userObjectId = req.params.userObjectId; // Get UserObjectId from URL parameters

    if (!userObjectId) {
        return res.status(400).json({ message: "UserObjectId is required" });
    }

    try {
        const userFavoritesRef = db.collection('userFavorites').doc(userObjectId);
        const userFavoritesDoc = await userFavoritesRef.get();

        if (!userFavoritesDoc.exists) {
            return res.status(404).json({ message: 'User favorites not found.' });
        }

        const userFavoritesData = userFavoritesDoc.data();
        const favoriteRecipes = userFavoritesData.favoriteRecipes || []; // Get the favoriteRecipes array

        // Array to hold the details of each recipe
        const recipeDetailsArray = [];

        // Fetch details for each favorite recipe ID
        for (const recipeId of favoriteRecipes) {
            const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
                params: {
                    includeNutrition: true,
                    addWinePairing: true
                },
                headers: {
                    'x-api-key': SPOONACULAR_API_KEY,
                },
            });
            recipeDetailsArray.push(response.data); // Add the recipe details to the array
        }

        // Return the array of recipe details
        res.status(200).json(recipeDetailsArray);
    } catch (error) {
        console.error('Error fetching favorite recipe details:', error);
        res.status(500).json({ message: 'Failed to fetch favorite recipe details', error: error.message });
    }
});

// ... existing code ...

module.exports = router;