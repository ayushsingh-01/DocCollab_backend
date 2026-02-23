const Document = require('../models/Document');

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
                const { documentId, content } = data;

                await Document.findByIdAndUpdate(documentId, { content });

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
