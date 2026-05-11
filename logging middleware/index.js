const express = require('express');
const { loggingMiddleware, logger } = require('./logger');

const app = express();
const PORT = process.env.PORT || 8080;

// Apply the global logging middleware
app.use(loggingMiddleware);

// Sample Routes to demonstrate logging
app.get('/', (req, res) => {
    res.json({ message: "Hello World! Check the logs/app.log file." });
});

app.get('/error', (req, res) => {
    logger.error('This is a simulated application error');
    res.status(500).json({ error: "Something went wrong" });
});

app.get('/slow', (req, res) => {
    setTimeout(() => {
        res.json({ message: "This took 1 second" });
    }, 1000);
});

// Start the server
app.listen(PORT, () => {
    logger.info(`Server started on http://localhost:${PORT}`);
    console.log(`Server started on http://localhost:${PORT}`);
});
