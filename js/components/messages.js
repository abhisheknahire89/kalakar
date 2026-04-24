import { renderChatList } from './chat.js';
import { mockMessages } from '../mockData.js';

export async function renderMessagesView() {
  const chatList = document.querySelector('#chat-list');
  const chatWindow = document.querySelector('#chat-window');
  const chatHeader = document.querySelector('#chat-header');
  const chatInputArea = document.querySelector('#chat-input-area');
  const chatEmptyState = document.querySelector('#chat-empty-state');

  if (!chatList) return;

  chatList.innerHTML = '<div class="skeleton-container"></div>';

  try {
    await renderChatList();
  } catch (_) {
    // Fallback handled below
  }

  const hasRealItems = chatList.querySelector('.chat-item');
  if (hasRealItems) return;

  chatList.innerHTML = '';
  mockMessages.forEach((message) => {
    const item = document.createElement('div');
    item.className = 'chat-item';
    item.innerHTML = `
      <img src="${message.avatar}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
      <div class="chat-item-info">
        <h4>${message.name}</h4>
        <p>${message.preview}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
        <span style="font-size: 0.72rem; color: var(--muted);">${relativeTime(message.timestamp)}</span>
        ${message.unread > 0 ? `<span style="font-size:0.7rem; background:#E11D48; color:#fff; padding:2px 6px; border-radius:10px;">${message.unread}</span>` : ''}
      </div>
    `;
    chatList.appendChild(item);
  });

  if (chatHeader) chatHeader.classList.add('hidden');
  if (chatWindow) {
    chatWindow.classList.remove('hidden');
    chatWindow.innerHTML = `
      <div class="empty-state text-center" style="padding: 36px 20px;">
        <div style="font-size:2rem; margin-bottom:8px;">💬</div>
        <h3>Messages are active</h3>
        <p class="meta">Select a conversation to continue with casting teams and collaborators.</p>
      </div>
    `;
  }
  if (chatInputArea) chatInputArea.classList.add('hidden');
  if (chatEmptyState) chatEmptyState.classList.add('hidden');
}

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (60 * 1000)))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
}
