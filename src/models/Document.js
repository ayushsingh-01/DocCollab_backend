const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'Untitled Document',
        },
        content: {
            type: String, // String for MVP
            default: '',
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sharedWith: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                role: {
                    type: String,
                    enum: ['viewer', 'editor'],
                    default: 'viewer',
                },
            },
        ],
    },
    { timestamps: true }
);

// Cascade delete versions when a document is deleted
documentSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const DocumentVersion = require('./DocumentVersion');
        await DocumentVersion.deleteMany({ documentId: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
