require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);
const User = mongoose.model('User', new mongoose.Schema({
  phone: String, passwordHash: String, contacts: [String]
}));
const Message = mongoose.model('Message', new mongoose.Schema({
  from: String, to: String, text: String,
  timestamp: String, isRead: Boolean
}));

app.post('/register', async (req, res) => {
  const { phone, password } = req.body;
  if (await User.findOne({ phone })) return res.status(409).send('Phone already registered');
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ phone, passwordHash, contacts: [] });
  res.sendStatus(201);
});

app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).send('Invalid credentials');
  const token = jwt.sign({ phone }, process.env.JWT_SECRET);
  res.json({ token, contacts: user.contacts });
});

app.post('/add-contact', async (req, res) => {
  const { token, contactPhone } = req.body;
  const { phone } = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ phone });
  if (!user.contacts.includes(contactPhone)) {
    user.contacts.push(contactPhone);
    await user.save();
  }
  res.sendStatus(200);
});

const onlineUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const { phone } = jwt.verify(token, process.env.JWT_SECRET);
    socket.userPhone = phone;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  onlineUsers.set(socket.userPhone, socket.id);
  socket.on('chat message', async ({ to, text }) => {
    const msg = await Message.create({
      from: socket.userPhone, to, text,
      timestamp: new Date().toLocaleTimeString(),
      isRead: false
    });
    if (onlineUsers.has(to)) {
      io.to(onlineUsers.get(to)).emit('chat message', msg);
    }
    socket.emit('chat message', msg);
  });

  socket.on('message read', async (msgId) => {
    const msg = await Message.findById(msgId);
    if (msg) {
      msg.isRead = true;
      await msg.save();
      if (onlineUsers.has(msg.from)) {
        io.to(onlineUsers.get(msg.from)).emit('message read', msgId);
      }
    }
  });

  socket.on('disconnect', () => onlineUsers.delete(socket.userPhone));
});

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(__dirname));

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
