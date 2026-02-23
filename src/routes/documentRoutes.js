const express = require('express');
const router = express.Router();
const {
    createDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    shareDocument
} = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeDocument } = require('../middlewares/roleMiddleware');

const versionRoutes = require('./versionRoutes');

router.use('/:id/versions', versionRoutes);

router.route('/')
    .post(protect, createDocument)
    .get(protect, getDocuments);

router.route('/:id')
    .get(protect, authorizeDocument('viewer'), getDocumentById)
    .put(protect, authorizeDocument('editor'), updateDocument)
    .delete(protect, authorizeDocument('owner'), deleteDocument);

router.post('/:id/share', protect, authorizeDocument('owner'), shareDocument);

module.exports = router;
