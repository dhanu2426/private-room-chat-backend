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

// Function to ensure the key is 32 bytes long by hashing it with SHA-256
const getKey = (secret) => {
  return crypto.createHash('sha256').update(secret).digest();
};

// Encrypt message using AES-256-CTR
const encryptMessage = (message, secret) => {
  const key = getKey(secret); // Ensure the key is 32 bytes long
  const iv = crypto.randomBytes(16); // 16-byte IV for AES-256-CTR

  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
  let encrypted = cipher.update(message, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return both the IV and the encrypted message
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt message using AES-256-CTR
const decryptMessage = (encryptedMessage, secret) => {
  const key = getKey(secret); // Ensure the key is 32 bytes long
  const parts = encryptedMessage.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];

  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

app.get('/', (req, res) => {
  res.send('Welcome to the Private Room Chat backend!');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, username, secret }) => {
    if (!rooms[roomId]) rooms[roomId] = { users: [], secret };
    rooms[roomId].users.push({ id: socket.id, username });
    socket.join(roomId);
    io.to(roomId).emit('user-joined', username);
  });

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

  socket.on('disconnect', () => {
    for (const room in rooms) {
      rooms[room].users = rooms[room].users.filter((u) => u.id !== socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5010;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
