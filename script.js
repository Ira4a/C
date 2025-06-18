const socket = io(); // connect to server
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const messageText = input.value.trim();
  if (messageText === '') return;

  socket.emit('chat message', messageText); // send to server
  input.value = '';
});

// Receive and display message
socket.on('chat message', function (msg) {
  const message = document.createElement('div');
  message.classList.add('message');
  message.textContent = msg;
  messagesContainer.appendChild(message);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
