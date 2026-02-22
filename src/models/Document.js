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

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
