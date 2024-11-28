// server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

const rooms = {};

// Function to encrypt the message with a secret key
const encryptMessage = (message, secret) => {
  const cipher = crypto.createCipher('aes-256-ctr', secret);
  return cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
};

// Function to decrypt the message with the same secret key
const decryptMessage = (encryptedMessage, secret) => {
  const decipher = crypto.createDecipher('aes-256-ctr', secret);
  return decipher.update(encryptedMessage, 'hex', 'utf8') + decipher.final('utf8');
};

// Route to serve something on the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Private Room Chat backend!');
});

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', ({ roomId, username, secret }) => {
    if (!rooms[roomId]) rooms[roomId] = { users: [], secret };
    rooms[roomId].users.push({ id: socket.id, username });
    socket.join(roomId);
    io.to(roomId).emit('user-joined', username);
  });

  // Handle message sending
  socket.on('send-message', ({ roomId, message, secret }) => {
    const encryptedMessage = encryptMessage(message, secret);
    const sender = rooms[roomId]?.users.find((u) => u.id === socket.id);
    
    if (sender) {
      io.to(roomId).emit('receive-message', {
        username: sender.username,
        message: encryptedMessage,
      });
    } else {
      console.error('Sender not found in room.');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room].users = rooms[room].users.filter((u) => u.id !== socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Use the dynamic port (for deployment) or fallback to 5005 (for local development)
const PORT = process.env.PORT || 5010;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
