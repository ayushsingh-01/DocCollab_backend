const Document = require('../models/Document');
const DocumentVersion = require('../models/DocumentVersion');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a document room
        socket.on('join-document', (documentId) => {
            socket.join(documentId);
            console.log(`Socket ${socket.id} joined document: ${documentId}`);
        });

        // Receive document changes and broadcast to the room
        socket.on('send-changes', (data) => {
            // payload data should contain { documentId: ID, delta: 'changes or content' }
            const { documentId, delta } = data;

            // Broadcast changes to everyone else in the room
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });

        // Save document (MVP: Overwrite content - Last Write Wins)
        // Client should emit this every 5 seconds (debounce/throttle on client side)
        socket.on('save-document', async (data) => {
            try {
                // Ensure we get userId from somewhere. We can either pass it in the payload from the frontend
                // or extract it from socket authentication. For simplicity, we add it to payload.
                const { documentId, content, savedBy } = data;

                if (!content || !documentId) return;

                // 1. Update the current document
                await Document.findByIdAndUpdate(documentId, { content });

                // 2. Save a version snapshot
                // Note: Only saving a version if `savedBy` is provided by the frontend client
                if (savedBy) {
                    await DocumentVersion.create({
                        documentId,
                        content,
                        savedBy
                    });
                }

                // Optional: you can acknowledge the save back to the sender
                // socket.emit('document-saved', { timestamp: new Date() });
            } catch (error) {
                console.error('Error saving document via socket:', error.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};
