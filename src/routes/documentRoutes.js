const express = require('express');
const router = express.Router();
const {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument
} = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createDocument)
    .get(protect, getDocuments);

router.route('/:id')
    .get(protect, getDocumentById)
    .delete(protect, deleteDocument);

// Optional: you can add a route later for sharing a document

module.exports = router;
