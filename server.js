require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const Message = mongoose.model('Message', {
  username: String,
  text: String,
  timestamp: String
});

// Serve static files manually
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/styles.css', (_, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/script.js', (_, res) => res.sendFile(path.join(__dirname, 'script.js')));

// WebSocket logic
io.on('connection', async (socket) => {
  const history = await Message.find().sort({ _id: 1 }).limit(50);
  history.forEach(msg => socket.emit('chat message', msg));

  socket.on('chat message', async (msg) => {
    const saved = new Message(msg);
    await saved.save();
    io.emit('chat message', saved);
  });
});

server.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
