const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const {OpenAI} = require('openai');
const fd = require('fs');
const multer = require('multer');
// Set up storage engine, here using memory storage for simplicity
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { db } = require('../firebaseAdmin'); // Adjust the path as necessary

dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const instruction = "Detect the objects in the image and their quantity. Give me result in JSON Array form which includes object and have ItemName and Quantity";
async function predictImage(imageBuffer) {
    const base64Image = imageBuffer.toString('base64');
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini-2024-07-18",  // Adjust model ID as necessary
            messages: [
                {
                   role: "system",
                   content : [{
                       type: "text",
                       text: "Return a JSON structure based on the requirements of the user. Only return the JSON structure, nothing else. Do not return ```json. Not even \\n. the output should be just {[{\"ItemName\":\"xys\",\"Quantity\":22},{\"ItemName\":\"abc\",\"Quantity\":11}]}"
                   }]
                },
                {
                    role: "user",
                    content : [
                        {"type": "text", "text": instruction}
                    ,
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/jpeg;base64,${base64Image}`,
                                "detail": "low"
                            },
                        }
                    ]
                }
            ]
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Failed to predict image contents:', error);
        throw error;
    }
}

router.post('/', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No image uploaded.');
    }

    // Extract UserObjectId from the header
    const userObjectId = req.headers['user-object-id'];
    if (!userObjectId) {
        return res.status(400).send('User object ID must be provided in the header.');
    }

    try {
        let predictions = await predictImage(req.file.buffer);
        predictions = JSON.parse(predictions);
        const results = await Promise.all(predictions.map(async item => {
            const docRef = await db.collection('pantryItems').add({
                ItemName: item.ItemName,
                Quantity: item.Quantity,
                UserObjectId: userObjectId  // Adding the UserObjectId from header
            });
            return { id: docRef.id, ...item };
        }));

        res.json({
            message: 'Image processed and items added successfully.',
            addedItems: results
        });
    } catch (error) {
        console.error('Failed to process image or add items:', error);
        res.status(500).json({
            message: 'Error processing image or adding items',
            error: error.message
        });
    }
});

module.exports = router;