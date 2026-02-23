require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const server = http.createServer(app);

// Setup Socket.io
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: '*', // For MVP, allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
});

// Initialize socket events
const documentSockets = require('./sockets/documentSockets');
documentSockets(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
