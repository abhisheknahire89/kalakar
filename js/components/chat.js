import { createDeal, listDeals, listMessages, sendMessage, updateDealStatus, createAutoReply, getProfileById, getProfileSnapshot, getRelativeTime } from '../services/appData.js';
import { navigateTo } from '../router.js';
import { showToast } from './toast.js';

let activeDealId = '';
let activeTargetProfileId = '';
let chatBound = false;
let hireModalBound = false;

function ensureHireModal() {
  let modal = document.getElementById('hire-flow-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'hire-flow-modal';
  modal.className = 'modal-overlay hidden';
  modal.innerHTML = `
    <div class="modal-content panel beta-hire-modal">
      <header class="beta-composer-header">
        <div>
          <p class="beta-kicker">Deal flow</p>
          <h2>Start a thread</h2>
        </div>
        <button class="ghost small" id="hire-flow-close-btn">Close</button>
      </header>

      <div id="hire-flow-target" class="beta-hire-target"></div>

      <div class="beta-intent-grid">
        <button class="beta-intent-btn active" data-intent="hire">Hire</button>
        <button class="beta-intent-btn" data-intent="collaborate">Collaborate</button>
        <button class="beta-intent-btn" data-intent="message">Message</button>
      </div>

      <textarea id="hire-flow-note" class="beta-composer-textarea" placeholder="Give a little context so the other person knows what this is about."></textarea>

      <div class="beta-composer-actions">
        <button class="ghost" id="hire-flow-cancel-btn">Cancel</button>
        <button class="primary action-gold" id="hire-flow-submit-btn">Open deal room</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function getSelectedIntent() {
  return document.querySelector('.beta-intent-btn.active')?.dataset.intent || 'hire';
}

function bindHireModal() {
  if (hireModalBound) return;
  hireModalBound = true;

  const modal = ensureHireModal();
  const close = () => {
    modal.classList.add('hidden');
    activeTargetProfileId = '';
  };

  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });

  document.getElementById('hire-flow-close-btn')?.addEventListener('click', close);
  document.getElementById('hire-flow-cancel-btn')?.addEventListener('click', close);

  modal.addEventListener('click', (event) => {
    const button = event.target.closest('.beta-intent-btn');
    if (!button) return;
    modal.querySelectorAll('.beta-intent-btn').forEach((node) => node.classList.remove('active'));
    button.classList.add('active');
  });

  document.getElementById('hire-flow-submit-btn')?.addEventListener('click', async () => {
    const submit = document.getElementById('hire-flow-submit-btn');
    const note = document.getElementById('hire-flow-note')?.value || '';

    submit.disabled = true;
    submit.textContent = 'Opening...';

    try {
      const deal = await createDeal({
        targetProfileId: activeTargetProfileId,
        intent: getSelectedIntent(),
        note
      });
      close();
      activeDealId = deal.$id;
      await renderChatList();
      navigateTo('deal-room');
    } catch (error) {
      showToast(error?.message || 'Could not start the deal flow.', 'danger');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Open deal room';
    }
  });
}

function bindChatEvents() {
  if (chatBound) return;
  chatBound = true;

  const root = document.getElementById('messages-view');
  if (!root) return;

  root.addEventListener('click', async (event) => {
    const dealButton = event.target.closest('[data-deal-id]');
    if (dealButton && dealButton.dataset.dealAction === 'open') {
      activeDealId = dealButton.dataset.dealId;
      await renderChatList();
      return;
    }

    const statusButton = event.target.closest('[data-status-action]');
    if (statusButton) {
      await updateDealStatus(activeDealId, statusButton.dataset.statusAction);
      await renderChatList();
      return;
    }
  });

  root.addEventListener('submit', async (event) => {
    if (event.target.id !== 'deal-room-form') return;
    event.preventDefault();

    const input = document.getElementById('deal-room-input');
    const text = input?.value || '';
    if (!text.trim()) return;

    await sendMessage(activeDealId, text);
    input.value = '';
    await renderChatList();
  });
}

function dealStatusActions(deal, isOwner) {
  if (deal.status === 'pending') {
    return `
      <button class="ghost small" data-status-action="${isOwner ? 'cancelled' : 'rejected'}">${isOwner ? 'Cancel' : 'Reject'}</button>
      <button class="primary action-gold" data-status-action="active">${isOwner ? 'Mark active' : 'Accept'}</button>
    `;
  }

  if (deal.status === 'active') {
    return `
      <button class="ghost small" data-status-action="pending">Pause</button>
      <button class="primary action-gold" data-status-action="completed">Complete</button>
    `;
  }

  return `
    <button class="ghost small" disabled>${deal.status}</button>
  `;
}

async function renderActiveDeal(deals) {
  const activeDeal = deals.find((deal) => deal.$id === activeDealId) || deals[0] || null;
  const chatMain = document.getElementById('chat-main-area');
  if (!chatMain) return;

  if (!activeDeal) {
    chatMain.innerHTML = `
      <div class="beta-empty panel beta-chat-empty">
        <h3>No deal rooms yet</h3>
        <p class="meta">Hire, collaborate, or message someone from the feed or explore.</p>
      </div>
    `;
    return;
  }

  activeDealId = activeDeal.$id;
  const messages = await listMessages(activeDeal.$id);
  await createAutoReply(activeDeal);
  const refreshedMessages = await listMessages(activeDeal.$id);
  const currentProfile = getProfileSnapshot();
  const isOwner = activeDeal.ownerId === currentProfile?.$id;

  chatMain.innerHTML = `
    <div class="beta-chat-header panel">
      <div class="beta-chat-headline">
        <img class="beta-avatar" src="${activeDeal.counterpart.avatarUrl}" alt="${activeDeal.counterpart.name}" />
        <div>
          <strong>${activeDeal.counterpart.name}</strong>
          <p class="meta">${activeDeal.intent} · ${activeDeal.status}</p>
        </div>
      </div>
      <div class="beta-card-actions">
        ${dealStatusActions(activeDeal, isOwner)}
      </div>
    </div>

    <div class="beta-chat-thread panel">
      ${refreshedMessages.length ? refreshedMessages.map((message) => `
        <div class="beta-message ${message.senderId === currentProfile?.$id ? 'is-mine' : ''}">
          <div class="beta-message-bubble">
            <p>${message.text}</p>
            <span>${getRelativeTime(message.createdAt)}</span>
          </div>
        </div>
      `).join('') : `
        <div class="beta-empty">
          <h3>Deal room opened</h3>
          <p class="meta">Send the first message to align on scope, dates, and next steps.</p>
        </div>
      `}
    </div>

    <form id="deal-room-form" class="beta-chat-form panel">
      <input id="deal-room-input" type="text" placeholder="Send a message, update, or next step..." autocomplete="off" />
      <button class="primary action-gold" type="submit">Send</button>
    </form>
  `;
}

export function initChatModule() {
  bindChatEvents();
  bindHireModal();
}

export async function renderChatList() {
  initChatModule();
  const container = document.getElementById('messages-view');
  if (!container) return;

  const deals = await listDeals();

  container.innerHTML = `
    <section class="beta-deal-shell">
      <div class="beta-feed-toolbar">
        <div>
          <p class="beta-kicker">Deal Room</p>
          <h2>Hiring, collaboration, and creator chat</h2>
        </div>
      </div>

      <div class="beta-deal-layout">
        <aside class="beta-deal-list panel">
          ${deals.length ? deals.map((deal) => `
            <button class="beta-deal-item ${deal.$id === activeDealId ? 'active' : ''}" data-deal-id="${deal.$id}" data-deal-action="open">
              <img class="beta-avatar" src="${deal.counterpart.avatarUrl}" alt="${deal.counterpart.name}" />
              <div>
                <strong>${deal.counterpart.name}</strong>
                <p class="meta">${deal.intent} · ${deal.latestMessage}</p>
              </div>
              <span class="meta">${getRelativeTime(deal.updatedAt || deal.createdAt)}</span>
            </button>
          `).join('') : `
            <div class="beta-empty">
              <h3>No active threads</h3>
              <p class="meta">Open a hire or collaboration flow from the feed or explore.</p>
            </div>
          `}
        </aside>
        <div id="chat-main-area" class="beta-deal-main"></div>
      </div>
    </section>
  `;

  await renderActiveDeal(deals);
}

export async function openHireFlow(profileId) {
  if (profileId === getProfileSnapshot()?.$id) {
    showToast('Use the composer to publish your work. You do not need to hire yourself.', 'info');
    return;
  }

  const profile = await getProfileById(profileId);
  if (!profile) {
    showToast('That creator profile is unavailable right now.', 'danger');
    return;
  }

  activeTargetProfileId = profileId;
  bindHireModal();
  const modal = ensureHireModal();
  const target = document.getElementById('hire-flow-target');
  const note = document.getElementById('hire-flow-note');

  if (target) {
    target.innerHTML = `
      <div class="beta-hire-card panel">
        <img class="beta-avatar beta-avatar-lg" src="${profile.avatarUrl || `https://i.pravatar.cc/200?u=${encodeURIComponent(profile.$id)}`}" alt="${profile.name}" />
        <div>
          <strong>${profile.name}</strong>
          <p class="meta">${profile.primaryCraft || profile.role || 'Creator'} · ${profile.city || 'India'}</p>
        </div>
      </div>
    `;
  }

  if (note) note.value = '';
  modal.classList.remove('hidden');
}

export async function openChat(profileId, intent = 'message') {
  const deal = await createDeal({ targetProfileId: profileId, intent });
  activeDealId = deal.$id;
  await renderChatList();
  navigateTo('deal-room');
}
