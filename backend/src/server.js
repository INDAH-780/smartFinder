const express = require('express');
const cors = require('cors');
const { searchFileByName } = require('./esClient');

const app = express();
const port = 3000;

// Use CORS middleware
app.use(cors());

// Endpoint to search files by name
app.get('/search', async (req, res) => {
    const fileName = req.query.name;
    if (!fileName) {
        return res.status(400).json({ error: 'Name parameter is required' });
    }

    try {
        const result = await searchFileByName(fileName);
        res.json(result);
    } catch (error) {
        console.error('Error searching file:', error);
        res.status(500).json({ error: 'An error occurred while searching' });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
