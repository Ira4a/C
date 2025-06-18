let socket, token, currentChat;
const offlineEl = document.getElementById('offline');
function updateOnlineStatus() {
  offlineEl.style.display = navigator.onLine ? 'none' : 'block';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

async function register() {
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('pass').value;
  await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  alert('Registered. Please login.');
}
async function login() {
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('pass').value;
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  if (!res.ok) return alert('Login failed');
  const data = await res.json();
  token = data.token;
  showApp(data.contacts);
}
function logout() {
  socket.disconnect();
  location.reload();
}
function showApp(contacts) {
  document.getElementById('auth').hidden = true;
  document.getElementById('app').hidden = false;
  socket = io({ auth: { token } });
  const contactsEl = document.getElementById('contacts');
  contacts.forEach(c => {
    const el = document.createElement('div');
    el.textContent = c;
    el.onclick = () => selectChat(c);
    contactsEl.appendChild(el);
  });
  document.getElementById('btnMenu').onclick = () => {
    contactsEl.classList.toggle('show');
  };
  socket.on('chat message', appendMsg);
  socket.on('message read', id => {
    document.getElementById(id)?.classList.add('read');
  });
}
function selectChat(c) {
  currentChat = c;
  document.getElementById('messages').innerHTML = '';
}
function appendMsg(msg) {
  if (msg.to !== currentChat && msg.from !== currentChat) return;
  const msgEl = document.createElement('div');
  msgEl.className = 'message' + (msg.from === currentChat ? '' : ' own');
  msgEl.id = msg._id;
  msgEl.innerHTML = `<b>${msg.from}</b> <span class="status">${msg.timestamp}${msg.isRead ? ' ✓' : ' ...'}</span><br>${msg.text}`;
  document.getElementById('messages').appendChild(msgEl);
  msgEl.scrollIntoView();
  if (msg.to === currentChat) socket.emit('message read', msg._id);
}
function sendMsg(e) {
  e.preventDefault();
  const text = document.getElementById('msgInput').value;
  if (!text || !currentChat) return;
  socket.emit('chat message', { to: currentChat, text });
  document.getElementById('msgInput').value = '';
}
