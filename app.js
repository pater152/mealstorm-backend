const express = require('express');
const cors = require('cors');
const app = express();
const port = 3500;
const path = require('path');


app.use(cors());
app.use(express.json());
// Import routes
const userRoutes = require(path.join(__dirname, 'routes', 'userRoutes'));

const pantryRoutes = require(path.join(__dirname, 'routes', 'pantryRoutes'));
const imageUploadRoutes = require(path.join(__dirname, 'routes', 'imageUpload'));
const recipeRoutes = require(path.join(__dirname, 'routes', 'recipeRoutes'));// Import the new recipe routes

// Use routes
app.use('/users', userRoutes);
app.use('/pantry', pantryRoutes);
app.use('/upload', imageUploadRoutes);
app.use('/recipes', recipeRoutes); // Add the recipe routes

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Node.js App!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
