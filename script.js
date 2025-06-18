const socket = io();
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const offlineBanner = document.getElementById('offline-message');

let username = prompt("Enter your username:") || "Anonymous";
let selectedContact = "Anna"; // default contact
let messageStore = {}; // messages per contact

// Select a contact
function selectContact(name) {
  selectedContact = name;
  renderMessages();
}

function renderMessages() {
  messagesContainer.innerHTML = '';
  const messages = messageStore[selectedContact] || [];
  messages.forEach(msg => addMessageToUI(msg));
}

function addMessageToUI(msg) {
  const msgEl = document.createElement('div');
  msgEl.classList.add('message');
  msgEl.innerHTML = `
    <strong>${msg.username}</strong>: ${msg.text}
    <div class="meta">${msg.timestamp}</div>
    <div class="status">${msg.status || ''}</div>
  `;
  messagesContainer.appendChild(msgEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const text = input.value.trim();
  if (text === '') return;

  const timestamp = new Date().toLocaleTimeString();
  const msg = {
    username,
    text,
    timestamp,
    contact: selectedContact,
    status: 'sent'
  };

  // Save to local view
  if (!messageStore[selectedContact]) messageStore[selectedContact] = [];
  messageStore[selectedContact].push(msg);
  addMessageToUI(msg);

  socket.emit('chat message', msg);
  input.value = '';
});

// Update message status when delivered
socket.on('chat message', function (msg) {
  msg.status = 'delivered';
  if (!messageStore[msg.contact]) messageStore[msg.contact] = [];
  messageStore[msg.contact].push(msg);

  if (msg.contact === selectedContact) {
    addMessageToUI(msg);
  }
});

// Simulate "read" when user scrolls to bottom
messagesContainer.addEventListener('scroll', () => {
  const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight;
  if (isAtBottom) {
    const all = messagesContainer.querySelectorAll('.status');
    all.forEach(el => el.textContent = 'read');
  }
});

// Offline Detection
function updateOnlineStatus() {
  if (!navigator.onLine) {
    offlineBanner.classList.remove('hidden');
  } else {
    offlineBanner.classList.add('hidden');
  }
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
