const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

const api = require('./api.js'); // Import the API routes

app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the public directory

// Middleware
app.use(express.json());

app.use('/api', api); // Use the API routes

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html')); // Serve the app.html file
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});