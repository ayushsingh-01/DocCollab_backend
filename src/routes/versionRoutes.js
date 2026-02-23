const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access documentId from parent router

const {
    saveSnapshot,
    getVersionHistory,
    restoreVersion
} = require('../controllers/versionController');

const { protect } = require('../middlewares/authMiddleware');
const { authorizeDocument } = require('../middlewares/roleMiddleware');

// Base route is /api/documents/:id/versions

router.route('/')
    .post(protect, authorizeDocument('editor', 'owner'), saveSnapshot)
    .get(protect, authorizeDocument('viewer', 'editor', 'owner'), getVersionHistory);

router.post('/:versionId/restore', protect, authorizeDocument('editor', 'owner'), restoreVersion);

module.exports = router;
