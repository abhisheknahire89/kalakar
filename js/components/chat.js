import { databases, Query, APPWRITE_CONFIG, ID, client, storage } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openContractBuilder, initContractBuilder, renderDealMemoCard } from './contractBuilder.js';
import { showToast } from './toast.js';

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

let activeConversationId = null;
let activeRecipientId = null;
let unsubscribeMessages = null;

export function initChatModule() {
  initContractBuilder(async (dealData) => {
    // When a deal is built, create a contract doc and send a special message
    try {
        const contract = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.contracts,
            ID.unique(),
            {
                ...dealData,
                status: 'pending',
                createdAt: new Date().toISOString()
            }
        );
        sendMessage(null, 'contract', contract.$id);
    } catch (error) {
        showToast('Failed to create contract', 'danger');
    }
  });

  sendMsgBtn?.addEventListener('click', () => {
    const text = chatInput.value.trim();
    if (text) {
      sendMessage(text);
      chatInput.value = '';
    }
  });

  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMsgBtn.click();
  });

  initiateContractBtn?.addEventListener('click', () => {
    openContractBuilder();
  });
}

export async function renderChatList() {
  if (!chatList) return;
  const myProfile = StorageService.get('kalakar_user_profile');
  if (!myProfile) return;

  chatList.innerHTML = '<div class="skeleton-container"></div>';

  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.conversations,
      [
        Query.search('participantIds', myProfile.$id),
        Query.orderDesc('updatedAt')
      ]
    );

    chatList.innerHTML = '';
    
    for (const conv of response.documents) {
      const recipientId = conv.participantIds.find(id => id !== myProfile.$id);
      const recipient = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.creators,
        recipientId
      );

      const item = document.createElement('div');
      item.className = `chat-item ${activeConversationId === conv.$id ? 'active' : ''}`;
      
      const avatar = recipient.avatarFileId ? 
        storage.getFilePreview(APPWRITE_CONFIG.buckets.avatars, recipient.avatarFileId, 100).href : 
        `https://i.pravatar.cc/100?u=${recipient.$id}`;

      item.innerHTML = `
        <img src="${avatar}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
        <div class="chat-item-info">
          <h4>${recipient.name}</h4>
          <p>${conv.lastMessage || 'Start a conversation...'}</p>
        </div>
        <div style="font-size: 0.7rem; color: var(--muted);">
          ${formatTime(conv.updatedAt)}
        </div>
      `;
      
      item.onclick = () => openChat(recipientId);
      chatList.appendChild(item);
    }
  } catch (error) {
    console.error('Chat list error:', error);
  }
}

export async function openChat(recipientId) {
  const myProfile = StorageService.get('kalakar_user_profile');
  if (!myProfile) return;

  activeRecipientId = recipientId;
  
  try {
    const recipient = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.creators,
        recipientId
    );

    chatUserName.textContent = recipient.name;
    const avatar = recipient.avatarFileId ? 
        storage.getFilePreview(APPWRITE_CONFIG.buckets.avatars, recipient.avatarFileId, 100).href : 
        `https://i.pravatar.cc/100?u=${recipient.$id}`;
    chatUserAvatar.src = avatar;

    // 1. Find or Create Conversation
    const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.conversations,
        [
            Query.search('participantIds', myProfile.$id),
            Query.search('participantIds', recipientId)
        ]
    );

    if (response.documents.length > 0) {
        activeConversationId = response.documents[0].$id;
    } else {
        const newConv = await databases.createDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.conversations,
            ID.unique(),
            {
                participantIds: [myProfile.$id, recipientId],
                lastMessage: '',
                updatedAt: new Date().toISOString()
            }
        );
        activeConversationId = newConv.$id;
    }

    chatHeader.classList.remove('hidden');
    chatWindow.classList.remove('hidden');
    chatInputArea.classList.remove('hidden');
    chatEmptyState.classList.add('hidden');

    renderMessages();
    setupRealtime();
    renderChatList();
    setView('messages');

  } catch (error) {
    console.error('Open chat error:', error);
  }
}

async function renderMessages() {
  if (!activeConversationId) return;
  chatWindow.innerHTML = '<div class="skeleton-container"></div>';

  try {
    const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.messages,
        [
            Query.equal('conversationId', activeConversationId),
            Query.orderAsc('createdAt'),
            Query.limit(50)
        ]
    );

    chatWindow.innerHTML = '';
    const myProfile = StorageService.get('kalakar_user_profile');

    for (const msg of response.documents) {
        appendMessage(msg, myProfile.$id);
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error('Messages error:', error);
  }
}

function appendMessage(msg, myId) {
    const div = document.createElement('div');
    div.className = `chat-message ${msg.senderId === myId ? 'sent' : 'received'}`;
    
    if (msg.type === 'contract' && msg.contractId) {
        // Fetch contract and render card
        div.innerHTML = '<div class="skeleton" style="height:200px; width:300px;"></div>';
        div.style.background = 'transparent';
        div.style.padding = '0';
        fetchAndRenderContract(msg.contractId, div);
    } else {
        div.textContent = msg.text;
    }
    chatWindow.appendChild(div);
}

async function fetchAndRenderContract(contractId, container) {
    try {
        const contract = await databases.getDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.contracts,
            contractId
        );
        container.innerHTML = renderDealMemoCard(contract);
        // Re-bind accept buttons
        container.querySelectorAll('.accept-deal-btn').forEach(btn => {
            btn.onclick = () => handleDealStatus(contractId, 'signed');
        });
    } catch (error) {
        container.innerHTML = '<p class="meta">Contract unavailable.</p>';
    }
}

async function sendMessage(text, type = 'text', contractId = null) {
  if (!activeConversationId) return;
  const myProfile = StorageService.get('kalakar_user_profile');

  try {
    const msg = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.messages,
        ID.unique(),
        {
            conversationId: activeConversationId,
            senderId: myProfile.$id,
            text: text || (type === 'contract' ? '📜 New Deal Memo' : ''),
            type: type,
            contractId: contractId,
            createdAt: new Date().toISOString()
        }
    );

    // Update conversation meta
    await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.conversations,
        activeConversationId,
        {
            lastMessage: text || '📜 Deal Memo',
            updatedAt: new Date().toISOString()
        }
    );

    // appendMessage(msg, myProfile.$id); // Real-time will handle this if active
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error('Send message error:', error);
  }
}

function setupRealtime() {
    if (unsubscribeMessages) unsubscribeMessages();

    unsubscribeMessages = client.subscribe(
        `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.messages}.documents`,
        (response) => {
            const myProfile = StorageService.get('kalakar_user_profile');
            const msg = response.payload;

            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                if (msg.conversationId === activeConversationId) {
                    appendMessage(msg, myProfile.$id);
                    chatWindow.scrollTop = chatWindow.scrollHeight;
                }
                renderChatList(); // Refresh sidebar for last message
            }
        }
    );
}

async function handleDealStatus(contractId, newStatus) {
    try {
        await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.contracts,
            contractId,
            { status: newStatus }
        );
        showToast('Deal status updated!', 'success');
        renderMessages();
    } catch (error) {
        showToast('Update failed', 'danger');
    }
}

function formatTime(isoStr) {
  const date = new Date(isoStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
