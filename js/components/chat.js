import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openContractBuilder, initContractBuilder, renderDealMemoCard } from './contractBuilder.js';

const chatWindow = document.querySelector('#chat-window');
const chatList = document.querySelector('#chat-list');
const chatInput = document.querySelector('#chat-message-input');
const chatHeader = document.querySelector('#chat-header');
const chatEmptyState = document.querySelector('#chat-empty-state');
const chatInputArea = document.querySelector('#chat-input-area');
const chatUserName = document.querySelector('#chat-user-name');
const chatUserAvatar = document.querySelector('#chat-user-avatar');
const sendMsgBtn = document.querySelector('#send-msg-btn');
const initiateContractBtn = document.querySelector('#initiate-contract-btn');

let activeChatId = null;

export function initChatModule() {
  initContractBuilder((dealData) => {
    // When a deal is built, inject it as a message
    sendMessage(null, dealData);
  });

  if (sendMsgBtn) {
    sendMsgBtn.addEventListener('click', () => {
      const text = chatInput.value.trim();
      if (text) {
        sendMessage(text);
        chatInput.value = '';
      }
    });
  }

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMsgBtn.click();
      }
    });
  }

  if (initiateContractBtn) {
    initiateContractBtn.addEventListener('click', () => {
      openContractBuilder();
    });
  }
}

export function renderChatList() {
  const creators = StorageService.get('kalakar_creators') || [];
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];

  if (!chatList) return;
  chatList.innerHTML = '';

  creators.forEach(creator => {
    const userMsgs = messages.filter(m => m.chatId === creator.id);
    const lastMsg = userMsgs[userMsgs.length - 1];
    
    const item = document.createElement('div');
    item.className = `chat-item ${activeChatId === creator.id ? 'active' : ''}`;
    
    item.innerHTML = `
      <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(creator.name)}" style="width: 48px; height: 48px; border-radius: 50%;">
      <div class="chat-item-info">
        <h4>${creator.name}</h4>
        <p>${lastMsg ? (lastMsg.type === 'deal-memo' ? '📜 Deal Memo Sent' : lastMsg.text) : 'Tap to start deal...'}</p>
      </div>
      <div style="font-size: 0.7rem; color: var(--muted);">
        ${lastMsg ? formatTime(lastMsg.timestamp) : ''}
      </div>
    `;
    
    item.addEventListener('click', () => openChat(creator.id));
    chatList.appendChild(item);
  });
}

export function openChat(creatorId) {
  activeChatId = creatorId;
  const creators = StorageService.get('kalakar_creators') || [];
  const creator = creators.find(c => c.id === creatorId);

  if (!creator) return;

  chatUserName.textContent = creator.name;
  chatUserAvatar.src = `https://i.pravatar.cc/150?u=${encodeURIComponent(creator.name)}`;
  
  chatHeader.classList.remove('hidden');
  chatWindow.classList.remove('hidden');
  chatInputArea.classList.remove('hidden');
  chatEmptyState.classList.add('hidden');

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
    chatWindow.innerHTML = `
      <div class="empty-state text-center" style="margin-top: auto; padding: 20px;">
        <p class="meta">This is the start of your professional dialogue with <strong>${chatUserName.textContent}</strong>.</p>
        <p class="meta" style="font-size: 0.75rem;">Keep communications here to ensure protection under Kalakar's Escrow terms.</p>
      </div>
    `;
  }

  chatMsgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `chat-message ${m.senderId === currentUserId ? 'sent' : 'received'}`;
    
    if (m.type === 'deal-memo') {
      div.innerHTML = renderDealMemoCard(m.data);
      div.style.background = 'transparent'; // Card handles its own styling
      div.style.padding = '0';
      div.style.maxWidth = '100%';
    } else {
      div.textContent = m.text;
    }
    
    chatWindow.appendChild(div);
  });

  // Re-bind deal buttons
  document.querySelectorAll('.accept-deal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleDealStatus(e.target.dataset.id, 'signed'));
  });

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendMessage(text, dealData = null) {
  if (!activeChatId) return;

  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
  const newMessage = {
    id: 'msg_' + Date.now(),
    chatId: activeChatId,
    senderId: StorageService.get(StorageService.KEYS.USER),
    timestamp: Date.now(),
    text: text,
    type: dealData ? 'deal-memo' : 'text',
    data: dealData
  };

  messages.push(newMessage);
  StorageService.set(StorageService.KEYS.MESSAGES, messages);
  
  renderMessages();
  renderChatList();
}

function handleDealStatus(dealId, newStatus) {
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
  const msg = messages.find(m => m.data && m.data.id === dealId);
  if (msg) {
    msg.data.status = newStatus;
    StorageService.set(StorageService.KEYS.MESSAGES, messages);
    renderMessages();
    
    if (newStatus === 'signed' && window.showToast) {
      window.showToast('Deal Signed & Escrow Initialized!', 'success');
    }
  }
}

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Global initialization hook
document.addEventListener('DOMContentLoaded', () => {
    initChatModule();
});
