const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'CollabDocs API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

module.exports = app;
