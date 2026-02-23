import { StorageServiceInstance as StorageService, setView } from './core.js';

const chatWindow = document.querySelector('#chat-messages');
const chatList = document.querySelector('#chat-list');
const chatInput = document.querySelector('#chat-input');
const chatHeader = document.querySelector('#chat-header');
const chatInputArea = document.querySelector('#chat-input-area');
const chatUserName = document.querySelector('#chat-user-name');
let activeChatId = null;

export function renderChatList() {
  const creators = StorageService.get('kalakar_creators');
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];

  chatList.innerHTML = '';
  // Only show chats that have messages or are "Active Deals"
  creators.forEach(creator => {
    const lastMsg = messages.filter(m => m.chatId === creator.id).pop();
    const item = document.createElement('div');
    item.className = `chat-item ${activeChatId === creator.id ? 'active' : ''}`;
    item.innerHTML = `
      <h4>${creator.name}</h4>
      <p>${lastMsg ? lastMsg.text : 'Initiate project deal...'}</p>
    `;
    item.onclick = () => openChat(creator.id);
    chatList.appendChild(item);
  });
}

export function openChat(creatorId) {
  activeChatId = creatorId;
  const creators = StorageService.get('kalakar_creators');
  const creator = creators.find(c => c.id === creatorId);

  chatUserName.textContent = creator.name;
  chatHeader.classList.remove('hidden');
  chatInputArea.classList.remove('hidden');

  renderMessages();
  renderChatList();
  setView('messages');
}

export function renderMessages() {
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
  const currentUserId = StorageService.get(StorageService.KEYS.USER);
  const chatMsgs = messages.filter(m => m.chatId === activeChatId);

  chatWindow.innerHTML = '';
  if (chatMsgs.length === 0) {
    chatWindow.innerHTML = '<div class="empty-state">Professional communication channel opened. Safe for deal terms.</div>';
  }

  chatMsgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `chat-message ${m.senderId === currentUserId ? 'sent' : 'received'}`;
    div.textContent = m.text;
    chatWindow.appendChild(div);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
    // Reattached #send-msg-btn listener safely inside DOMContentLoaded
    const sendMsgBtn = document.querySelector('#send-msg-btn');
    if (sendMsgBtn) {
      sendMsgBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (!text || !activeChatId) return;

        const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
        messages.push({
          chatId: activeChatId,
          senderId: StorageService.get(StorageService.KEYS.USER),
          text: text,
          timestamp: Date.now()
        });

        StorageService.set(StorageService.KEYS.MESSAGES, messages);
        chatInput.value = '';
        renderMessages();
        renderChatList();
      });
    }
