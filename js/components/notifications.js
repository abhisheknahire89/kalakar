import { StorageServiceInstance as StorageService, setView } from './core.js';

export function renderNotifications() {
  const container = document.querySelector('#notifications-view');
  if (!container) return;

  const notifications = StorageService.get('kalakar_notifications') || [
    { id: 'n1', type: 'shortlist', text: 'You were shortlisted for "Assistant Director"', time: Date.now() - 3600000, read: false },
    { id: 'n2', type: 'vouch', text: 'Rahul Shinde vouched for your "Handheld" skill', time: Date.now() - 86400000, read: true },
    { id: 'n3', type: 'deal', text: 'Dharma Productions sent you a Deal Memo', time: Date.now() - 172800000, read: false }
  ];

  // Group by date
  const groups = {
    'Today': notifications.filter(n => (Date.now() - n.time) < 86400000),
    'Earlier': notifications.filter(n => (Date.now() - n.time) >= 86400000)
  };

  let html = `
    <div class="view-header" style="margin-bottom: 24px;">
      <h2 style="font-family: 'Yatra One', serif; font-size: 1.8rem;">Notifications</h2>
    </div>
  `;

  for (const [title, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    
    html += `<h4 class="meta" style="margin-bottom: 12px; font-size: 0.8rem; text-transform: uppercase;">${title}</h4>`;
    
    items.forEach(n => {
      html += `
        <div class="notification-card panel mb-3 ${n.read ? '' : 'unread'}" style="padding: 16px; display: flex; gap: 16px; align-items: flex-start; border: 1px solid ${n.read ? 'var(--line)' : 'var(--brand-gold)'}; background: ${n.read ? 'var(--surface)' : 'rgba(197, 160, 89, 0.05)'};">
          <div class="notif-icon" style="font-size: 1.5rem;">
            ${n.type === 'shortlist' ? '📋' : n.type === 'vouch' ? '⭐' : '💸'}
          </div>
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 0.95rem;">${n.text}</p>
            <span class="meta" style="font-size: 0.75rem;">${formatTime(n.time)}</span>
          </div>
          ${!n.read ? '<div style="width: 8px; height: 8px; background: var(--brand-gold); border-radius: 50%; margin-top: 6px;"></div>' : ''}
        </div>
      `;
    });
  }

  if (notifications.length === 0) {
    html += `
      <div class="empty-state text-center" style="padding: 40px;">
        <p>You're all caught up!</p>
      </div>
    `;
  }

  container.innerHTML = html;
  
  // Mark all as read
  setTimeout(() => {
    notifications.forEach(n => n.read = true);
    StorageService.set('kalakar_notifications', notifications);
    updateNotificationBadge();
  }, 2000);
}

export function updateNotificationBadge() {
  const notifications = StorageService.get('kalakar_notifications') || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  const badges = document.querySelectorAll('.nav-badge');
  badges.forEach(b => {
    if (unreadCount > 0) {
      b.textContent = unreadCount;
      b.classList.remove('hidden');
    } else {
      b.classList.add('hidden');
    }
  });
}

function formatTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return new Date(ts).toLocaleDateString();
}
