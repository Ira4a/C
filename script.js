const socket = io();
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

let username = prompt("Enter your username:") || "Anonymous";

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (text === '') return;

  const timestamp = new Date().toLocaleTimeString();
  socket.emit('chat message', { username, text, timestamp });
  input.value = '';
});

socket.on('chat message', function (msg) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message');
  messageEl.innerHTML = `<strong>${msg.username}</strong> [${msg.timestamp}]: ${msg.text}`;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
