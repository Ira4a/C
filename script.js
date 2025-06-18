const socket = io();

// Elements
const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');
const contactsPanel = document.getElementById('contacts-panel');
const contactsList = document.getElementById('contacts-list');
const toggleContactsBtn = document.getElementById('toggle-contacts');
const typingStatus = document.getElementById('typing-status');
const loadingScreen = document.getElementById('loading-screen');

// User and chat state
let username = prompt("Enter your username:") || "Anonymous";
let currentChatUser = null;
let contacts = {}; // { username: { online, unreadCount, typing } }

// Show loading screen initially
function showLoading(show) {
  if (show) loadingScreen.classList.remove('hidden');
  else loadingScreen.classList.add('hidden');
}

// Detect offline/online and show loading
window.addEventListener('load', () => {
  showLoading(!navigator.onLine);
});
window.addEventListener('offline', () => showLoading(true));
window.addEventListener('online', () => showLoading(false));

// Toggle contacts panel
toggleContactsBtn.addEventListener('click', () => {
  contactsPanel.classList.toggle('hidden');
  toggleContactsBtn.classList.toggle('active');
});

// Update contacts list UI
function updateContactsUI() {
  contactsList.innerHTML = '';
  Object.keys(contacts).forEach(user => {
    const contact = contacts[user];
    const div = document.createElement('div');
    div.classList.add('contact');
    if (user === currentChatUser) div.classList.add('active');

    div.innerHTML = `
      <span>${user}</span>
      <span class="status ${contact.online ? 'online' : 'offline'}">
        ${contact.typing ? 'typing...' : contact.online ? 'online' : 'offline'}
        ${contact.unreadCount ? `(${contact.unreadCount})` : ''}
      </span>
    `;
    div.addEventListener('click', () => {
      selectChat(user);
    });
    contactsList.appendChild(div);
  });
}

// Select chat with user
function selectChat(user) {
  currentChatUser = user;
  contacts[user].unreadCount = 0;
  updateContactsUI();
  messagesContainer.innerHTML = '';
  // Request chat history with this user (for demo, we just clear chat)
  // You can implement per-user chat history retrieval from backend
}

// Handle typing indicator timeout
let typingTimeout;
function showTyping(status) {
  typingStatus.textContent = status ? `${currentChatUser} is typing...` : '';
  if (typingTimeout) clearTimeout(typingTimeout);
  if (status) {
    typingTimeout = setTimeout(() => {
      typingStatus.textContent = '';
    }, 3000);
  }
}

// Send "typing" event with debounce
let typingTimer;
input.addEventListener('input', () => {
  socket.emit('typing', { to: currentChatUser, from: username });
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    socket.emit('stop typing', { to: currentChatUser, from: username });
  }, 2000);
});

// Send message
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentChatUser) {
    alert('Select a contact first');
    return;
  }
  const text = input.value.trim();
  if (!text) return;

  const timestamp = new Date().toLocaleTimeString();

  const msg = {
    from: username,
    to: currentChatUser,
    text,
    timestamp,
    status: 'sent' // initially
  };

  socket.emit('private message', msg);
  addMessage(msg, true);
  input.value = '';
});

// Add message to chat window
function addMessage(msg, isSelf = false) {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message');
  messageEl.classList.add(isSelf ? 'self' : 'other');

  messageEl.innerHTML = `
    <div><strong>${msg.from}</strong> <span class="meta">[${msg.timestamp}]</span></div>
    <div>${msg.text}</div>
    <div class="status">${msg.status || ''}</div>
  `;
  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Socket event handlers

// New private message received
socket.on('private message', (msg) => {
  // If message is from current chat user, show immediately
  if (msg.from === currentChatUser) {
    addMessage(msg, false);
    // Send read receipt
    socket.emit('message read', { from: username, to: msg.from });
  } else {
    // Update unread count
    if (!contacts[msg.from]) {
      contacts[msg.from] = { online: true, unreadCount: 1, typing: false };
    } else {
      contacts[msg.from].unreadCount = (contacts[msg.from].unreadCount || 0) + 1;
    }
    updateContactsUI();
  }
});

// Receive updated contact online status
