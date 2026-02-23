const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');

// @desc    Save document snapshot
// @route   POST /api/documents/:id/versions
// @access  Private (Editor or Owner)
const saveSnapshot = async (req, res) => {
    try {
        const document = req.document; // Available via roleMiddleware

        const version = await DocumentVersion.create({
            documentId: document._id,
            content: document.content,
            savedBy: req.user._id,
        });

        res.status(201).json(version);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get version history (paginated)
// @route   GET /api/documents/:id/versions
// @access  Private (Viewer, Editor, Owner)
const getVersionHistory = async (req, res) => {
    try {
        const documentId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await DocumentVersion.countDocuments({ documentId });

        const versions = await DocumentVersion.find({ documentId })
            .populate('savedBy', 'username email')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.json({
            versions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Restore a version
// @route   POST /api/documents/:id/versions/:versionId/restore
// @access  Private (Editor, Owner)
const restoreVersion = async (req, res) => {
    try {
        const document = req.document; // Available via roleMiddleware
        const { versionId } = req.params;

        const versionToRestore = await DocumentVersion.findById(versionId);

        if (!versionToRestore) {
            return res.status(404).json({ message: 'Version not found' });
        }

        if (versionToRestore.documentId.toString() !== document._id.toString()) {
            return res.status(400).json({ message: 'Version does not belong to this document' });
        }

        // 1. Save current state as a new snapshot before restoring (optional but good practice)
        await DocumentVersion.create({
            documentId: document._id,
            content: document.content,
            savedBy: req.user._id,
            // You could add a 'commit message' flag like { message: 'Auto-snapshot before restore' }
        });

        // 2. Update document content
        document.content = versionToRestore.content;
        await document.save();

        // 3. Save the restored version as a new snapshot (as requested)
        const newRestoredVersion = await DocumentVersion.create({
            documentId: document._id,
            content: document.content,
            savedBy: req.user._id,
            // You could add { message: `Restored from version ${versionId}` }
        });

        res.json({
            message: 'Document restored successfully',
            document,
            newVersion: newRestoredVersion
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    saveSnapshot,
    getVersionHistory,
    restoreVersion
};
