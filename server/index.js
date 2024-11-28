const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(express.json());

// Allow specific frontend origins
const allowedOrigins = ['https://endearing-flan-e22b8e.netlify.app'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

const rooms = {};

// Encryption function using `crypto.createCipheriv`
const encryptMessage = (message, secret) => {
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.createHash('sha256').update(secret).digest(); // Generate key from secret
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);
  return { encryptedMessage: encrypted.toString('hex'), iv: iv.toString('hex') };
};

// Route to serve something on the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the Private Room Chat backend!');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle room join request
  socket.on('join-room', ({ roomId, username, secret }) => {
    if (!roomId || !username || !secret) {
      console.error('Invalid room join request');
      return;
    }

    if (!rooms[roomId]) rooms[roomId] = { users: [], secret };
    rooms[roomId].users.push({ id: socket.id, username });
    socket.join(roomId);
    io.to(roomId).emit('user-joined', username);
  });

  // Handle sending messages
  socket.on('send-message', ({ roomId, message, secret }) => {
    if (!rooms[roomId] || rooms[roomId].secret !== secret) {
      console.error('Invalid room or secret for message');
      return;
    }

    const { encryptedMessage, iv } = encryptMessage(message, secret);
    const sender = rooms[roomId]?.users.find((u) => u.id === socket.id);

    if (sender) {
      io.to(roomId).emit('receive-message', {
        username: sender.username,
        message: encryptedMessage,
        iv, // Include IV for decryption
      });
    } else {
      console.error('Sender not found in room.');
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room].users = rooms[room].users.filter((u) => u.id !== socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

// Use the dynamic port (for deployment) or fallback to 5005 (for local development)
const PORT = process.env.PORT || 5009;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
