const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const messageText = input.value.trim();
  if (messageText === '') return;

  // Create message element
  const message = document.createElement('div');
  message.classList.add('message');
  message.textContent = messageText;

  // Add message to the chat
  messagesContainer.appendChild(message);

  // Scroll to the bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // Clear input
  input.value = '';
});
