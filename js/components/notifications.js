import { databases, Query, client, DATABASE_ID, COLLECTIONS } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService } from './core.js';
import { showToast } from './toast.js';

let unsubscribeNotifications = null;
const NOTIFICATIONS_COLLECTION = COLLECTIONS.NOTIFICATIONS || COLLECTIONS.notifications;

export async function renderNotifications() {
  const container = document.querySelector('#notifications-view');
  if (!container) return;

  const myProfile = StorageService.get('kalakar_user_profile');
  if (!myProfile) return;

  container.innerHTML = '<div class="skeleton-container"></div>';

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      [
        Query.equal('userId', myProfile.$id),
        Query.orderDesc('createdAt'),
        Query.limit(50)
      ]
    );

    const notifications = response.documents;

    let html = `
      <div class="view-header" style="margin-bottom: 24px;">
        <h2 style="font-family: 'Yatra One', serif; font-size: 1.8rem;">Notifications</h2>
      </div>
    `;

    if (notifications.length === 0) {
      html += `
        <div class="empty-state text-center" style="padding: 60px 20px;">
          <div style="font-size:3rem; margin-bottom:1rem;">🔔</div>
          <h3>You're all caught up!</h3>
          <p class="meta">New casting calls and vouches will appear here.</p>
        </div>
      `;
    } else {
      notifications.forEach(n => {
        html += `
          <div class="notification-card panel mb-3 ${n.isRead ? '' : 'unread'}" 
               style="padding: 16px; display: flex; gap: 16px; align-items: flex-start; 
                      border: 1px solid ${n.isRead ? 'var(--line)' : 'var(--brand-gold)'}; 
                      background: ${n.isRead ? 'var(--surface)' : 'rgba(197, 160, 89, 0.05)'};">
            <div class="notif-icon" style="font-size: 1.5rem;">
              ${getIcon(n.type)}
            </div>
            <div style="flex: 1;">
              <p style="margin: 0; font-size: 0.95rem;">${n.text}</p>
              <span class="meta" style="font-size: 0.75rem;">${formatTime(n.createdAt)}</span>
            </div>
            ${!n.isRead ? '<div style="width: 8px; height: 8px; background: var(--brand-gold); border-radius: 50%; margin-top: 6px;"></div>' : ''}
          </div>
        `;
      });
    }

    container.innerHTML = html;

    // Mark current batch as read
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.$id);
    if (unreadIds.length > 0) {
        for (const id of unreadIds) {
            await databases.updateDocument(
                DATABASE_ID,
                NOTIFICATIONS_COLLECTION,
                id,
                { isRead: true }
            );
        }
        updateNotificationBadge(); // Refresh badge
    }

  } catch (error) {
    console.error('Notifications error:', error);
    container.innerHTML = '<p class="text-center meta">Failed to load notifications.</p>';
  }
}

export async function updateNotificationBadge() {
  const myProfile = StorageService.get('kalakar_user_profile');
  if (!myProfile) return;

  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      [
        Query.equal('userId', myProfile.$id),
        Query.equal('isRead', false),
        Query.limit(1) // We just need total
      ]
    );

    const unreadCount = response.total;
    const badges = document.querySelectorAll('.nav-badge');
    badges.forEach(b => {
      if (unreadCount > 0) {
        b.textContent = unreadCount > 9 ? '9+' : unreadCount;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
    });
  } catch (error) {
    // Ignore badge errors
  }
}

export function setupNotificationListener() {
    const myProfile = StorageService.get('kalakar_user_profile');
    if (!myProfile) return;

    if (unsubscribeNotifications) unsubscribeNotifications();

    unsubscribeNotifications = client.subscribe(
        `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION}.documents`,
        (response) => {
            if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                const notif = response.payload;
                if (notif.userId === myProfile.$id) {
                    showToast(notif.text, 'info');
                    updateNotificationBadge();
                    // If viewing notifications right now, refresh
                    const currentView = document.getElementById('notifications-view');
                    if (currentView && !currentView.classList.contains('hidden')) {
                        renderNotifications();
                    }
                }
            }
        }
    );
}

function getIcon(type) {
    switch(type) {
        case 'shortlist': return '📋';
        case 'vouch': return '⭐';
        case 'deal': return '💸';
        case 'connection': return '🤝';
        default: return '🔔';
    }
}

function formatTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return new Date(isoStr).toLocaleDateString();
}
