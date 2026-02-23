const mongoose = require('mongoose');

const documentVersionSchema = new mongoose.Schema(
    {
        documentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Document',
            required: true,
            index: true,
        },
        content: {
            type: String,
            default: '',
        },
        savedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const DocumentVersion = mongoose.model('DocumentVersion', documentVersionSchema);
module.exports = DocumentVersion;
