const Document = require('../models/Document');
const { createDocumentSchema } = require('../utils/validation');

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res) => {
    try {
        const validationResult = createDocumentSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ message: 'Validation error', errors: validationResult.error.errors });
        }

        const { title, content } = req.body;

        const document = await Document.create({
            title: title || 'Untitled Document',
            content: content || '',
            owner: req.user._id,
        });

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all documents for user (owned + shared)
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { owner: req.user._id },
                { 'sharedWith.userId': req.user._id }
            ]
        })
            .populate('owner', 'username email')
            .sort({ updatedAt: -1 });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('owner', 'username email')
            .populate('sharedWith.userId', 'username email');

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if user has access (owner or sharedWith)
        const isOwner = document.owner._id.toString() === req.user._id.toString();
        const isShared = document.sharedWith.some(
            (share) => share.userId._id.toString() === req.user._id.toString()
        );

        if (!isOwner && !isShared) {
            return res.status(403).json({ message: 'Not authorized to access this document' });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete document (owner only)
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if user is owner
        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the owner can delete this document' });
        }

        await document.deleteOne();

        res.json({ message: 'Document removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocumentById,
    deleteDocument,
};
