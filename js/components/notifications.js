import { listNotifications, markNotificationsRead, getUnreadNotificationCount } from '../services/appData.js';
import { openPostComposer } from './postComposer.js';
import { navigateTo } from '../router.js';

let notificationsBound = false;

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateBadge(count) {
  document.querySelectorAll('.nav-badge').forEach((badge) => {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.classList.toggle('hidden', count === 0);
  });
}

function bindNotifications() {
  if (notificationsBound) return;
  notificationsBound = true;

  document.getElementById('notifications-view')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cta-route]');
    if (!button) return;

    const route = button.dataset.ctaRoute;
    if (route === 'composer') {
      openPostComposer();
      return;
    }

    navigateTo(route);
  });
}

export async function renderNotifications() {
  bindNotifications();
  const container = document.getElementById('notifications-view');
  if (!container) return;

  const notifications = await listNotifications();
  const unreadIds = notifications.filter((notification) => !notification.isRead).map((notification) => notification.$id);
  updateBadge(getUnreadNotificationCount(notifications));

  container.innerHTML = `
    <section class="beta-notifications-shell">
      <div class="beta-feed-toolbar">
        <div>
          <p class="beta-kicker">Notifications</p>
          <h2>Your launch pulse</h2>
        </div>
      </div>

      <div class="beta-post-list">
        ${notifications.length ? notifications.map((notification) => `
          <article class="beta-notification-card panel ${notification.isRead ? '' : 'unread'}">
            <div>
              <strong>${escapeHtml(notification.text)}</strong>
              <p class="meta">${new Date(notification.createdAt).toLocaleString()}</p>
            </div>
            ${notification.ctaLabel ? `<button class="ghost small" data-cta-route="${notification.ctaRoute || 'feed'}">${escapeHtml(notification.ctaLabel)}</button>` : ''}
          </article>
        `).join('') : `
          <div class="beta-empty panel">
            <h3>No updates yet</h3>
            <p class="meta">Once people react, hire, or reply, this inbox will light up.</p>
          </div>
        `}
      </div>
    </section>
  `;

  if (unreadIds.length) {
    await markNotificationsRead(unreadIds);
    updateBadge(0);
  }
}

export async function updateNotificationBadge() {
  const notifications = await listNotifications();
  updateBadge(getUnreadNotificationCount(notifications));
}

export function setupNotificationListener() {}
