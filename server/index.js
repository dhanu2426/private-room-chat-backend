const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const cors = require('cors');

// Initialize Express app and middleware
const app = express();
app.use(cors());
app.use(express.json());

// Create an HTTP server to handle requests
const server = http.createServer(app);

// Initialize Socket.IO server
const io = new Server(server, {
  cors: { origin: '*' },
});

const rooms = {};

// Encryption function for messages
const encryptMessage = (message, secret) => {
  const cipher = crypto.createCipher('aes-256-ctr', secret);
  return cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
};

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', ({ roomId, username, secret }) => {
    if (!rooms[roomId]) rooms[roomId] = { users: [], secret };
    rooms[roomId].users.push({ id: socket.id, username });
    socket.join(roomId);
    io.to(roomId).emit('user-joined', username);
  });

  // Handle sending messages to a room
  socket.on('send-message', ({ roomId, message, secret }) => {
    const encryptedMessage = encryptMessage(message, secret);
    io.to(roomId).emit('receive-message', {
      username: rooms[roomId].users.find((u) => u.id === socket.id).username,
      message: encryptedMessage,
    });
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room].users = rooms[room].users.filter((u) => u.id !== socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Use dynamic port for deployment or fallback to 5001 for local development
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
