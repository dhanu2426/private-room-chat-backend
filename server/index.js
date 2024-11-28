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

const encryptMessage = (message, secret) => {
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16); // Initialization vector
  const key = crypto.createHash('sha256').update(String(secret)).digest(); // Generate a 256-bit key

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(message, 'utf8'), cipher.final()]);

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
  };
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
        message: encryptedMessage.content,
        iv: encryptedMessage.iv, // Send the IV along with the message
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
