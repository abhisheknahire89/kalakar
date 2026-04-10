import { getProfileById, getProfileSnapshot, listProfilePosts } from '../services/appData.js';
import { openHireFlow, openChat } from './chat.js';
import { logout } from '../auth.js';

let activeProfileId = '';
let profileBound = false;

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function bindProfileEvents() {
  if (profileBound) return;
  profileBound = true;

  document.getElementById('profile-view')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-profile-action]');
    if (!button) return;

    const profileId = button.dataset.profileId;
    if (button.dataset.profileAction === 'hire') {
      await openHireFlow(profileId);
      return;
    }

    if (button.dataset.profileAction === 'message') {
      await openChat(profileId, 'message');
      return;
    }

    if (button.dataset.profileAction === 'logout') {
      await logout();
      window.location.hash = '';
      window.location.reload();
    }
  });
}

export async function renderProfile(profileId = '') {
  bindProfileEvents();

  const container = document.getElementById('profile-view');
  if (!container) return;

  const fallbackProfile = getProfileSnapshot();
  activeProfileId = profileId || activeProfileId || fallbackProfile?.$id || '';

  const profile = await getProfileById(activeProfileId) || fallbackProfile;
  const posts = await listProfilePosts(profile?.$id);
  const isSelf = profile?.$id === fallbackProfile?.$id;

  if (!profile) {
    container.innerHTML = `
      <div class="beta-empty panel">
        <h3>Profile unavailable</h3>
        <p class="meta">Complete onboarding to unlock your public profile.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <section class="beta-profile-shell">
      <article class="beta-profile-hero panel">
        <img class="beta-profile-avatar" src="${profile.avatarUrl || `https://i.pravatar.cc/280?u=${encodeURIComponent(profile.$id)}`}" alt="${escapeHtml(profile.name)}" />
        <div class="beta-profile-copy">
          <p class="beta-kicker">${isSelf ? 'Your profile' : 'Creator profile'}</p>
          <h2>${escapeHtml(profile.name)}</h2>
          <p class="meta">@${escapeHtml(profile.username || profile.name.toLowerCase().replace(/\s+/g, '_'))} · ${escapeHtml(profile.primaryCraft || profile.role || 'Creator')} · ${escapeHtml(profile.city || 'India')}</p>
          <p class="beta-card-copy">${escapeHtml(profile.bio || 'No bio added yet.')}</p>
          <div class="beta-chip-row">
            <span class="beta-chip">${profile.accountType === 'studio' ? 'Hiring account' : 'Creator account'}</span>
            <span class="beta-chip">${profile.yearsExperience || 0}+ years</span>
            <span class="beta-chip">${profile.isVerified ? 'Verified' : 'Beta member'}</span>
          </div>
          ${isSelf ? `
            <div class="beta-card-actions">
              <button class="ghost" disabled>Public profile</button>
              <button class="ghost" data-profile-action="logout">Logout</button>
            </div>
          ` : `
            <div class="beta-card-actions">
              <button class="ghost" data-profile-action="message" data-profile-id="${profile.$id}">Message</button>
              <button class="primary action-gold" data-profile-action="hire" data-profile-id="${profile.$id}">Hire</button>
            </div>
          `}
        </div>
      </article>

      <section class="beta-profile-posts">
        <div class="beta-feed-toolbar">
          <div>
            <p class="beta-kicker">Portfolio</p>
            <h2>Recent posts</h2>
          </div>
        </div>
        <div class="beta-post-list">
          ${posts.length ? posts.map((post) => `
            <article class="beta-post-card panel">
              <p class="beta-post-caption">${escapeHtml(post.contentText || 'Post')}</p>
              ${post.mediaUrl ? (post.mediaType === 'image'
                ? `<div class="beta-post-media"><img src="${post.mediaUrl}" alt="Profile post" /></div>`
                : `<div class="beta-post-media beta-post-media-video"><video src="${post.mediaUrl}" controls playsinline preload="metadata"></video></div>`) : ''}
            </article>
          `).join('') : `
            <div class="beta-empty panel">
              <h3>No posts yet</h3>
              <p class="meta">${isSelf ? 'Your first post will appear here after you publish it.' : 'This creator has not posted yet.'}</p>
            </div>
          `}
        </div>
      </section>
    </section>
  `;
}
