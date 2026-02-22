const Document = require('../models/Document');
const User = require('../models/User');
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
        // req.document is populated by roleMiddleware
        // we just need to populate the fields to match original logic
        const document = await Document.findById(req.document._id)
            .populate('owner', 'username email')
            .populate('sharedWith.userId', 'username email');

        res.json(document);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update document content/title
// @route   PUT /api/documents/:id
// @access  Private (Editor, Owner)
const updateDocument = async (req, res) => {
    try {
        const { title, content } = req.body;
        const document = req.document; // from middleware

        if (title !== undefined) document.title = title;
        if (content !== undefined) document.content = content;

        const updatedDocument = await document.save();
        res.json(updatedDocument);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Share document and assign role
// @route   POST /api/documents/:id/share
// @access  Private (Owner only)
const shareDocument = async (req, res) => {
    try {
        const { email, role } = req.body;
        const document = req.document;

        if (!['viewer', 'editor'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be viewer or editor.' });
        }

        const userToShareWith = await User.findOne({ email });
        if (!userToShareWith) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToShareWith._id.toString() === document.owner.toString()) {
            return res.status(400).json({ message: 'Cannot share document with its owner' });
        }

        // Check if already shared
        const alreadySharedIndex = document.sharedWith.findIndex(
            (share) => share.userId.toString() === userToShareWith._id.toString()
        );

        if (alreadySharedIndex !== -1) {
            // Update role if already shared
            document.sharedWith[alreadySharedIndex].role = role;
        } else {
            document.sharedWith.push({ userId: userToShareWith._id, role });
        }

        await document.save();
        res.json({ message: `Document shared with ${userToShareWith.username} as ${role}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete document (owner only)
// @route   DELETE /api/documents/:id
// @access  Private (Owner only)
const deleteDocument = async (req, res) => {
    try {
        const document = req.document; // loaded via middleware

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
    updateDocument,
    deleteDocument,
    shareDocument,
};
