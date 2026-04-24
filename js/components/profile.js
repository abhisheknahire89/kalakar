import { StorageServiceInstance as StorageService } from './core.js';
import { mockCurrentProfile, mockPosts, formatRelativeTime } from '../mockData.js';

export function renderProfile() {
  const container = document.querySelector('#profile-view');
  if (!container) return;

  const profile = StorageService.get('kalakar_user_profile') || mockCurrentProfile;

  if (!profile) {
    container.innerHTML = `
      <div class="view-header">
        <h2>Profile</h2>
      </div>
      <div class="empty-state text-center" style="padding: 48px 20px;">
        <h3>Profile Not Ready</h3>
        <p class="meta">Complete onboarding to unlock your profile.</p>
      </div>
    `;
    return;
  }

  const avatar = profile.avatarFileId
    ? `https://fra.cloud.appwrite.io/v1/storage/buckets/avatars/files/${encodeURIComponent(profile.avatarFileId)}/view?project=69c8ee1b0037e381d046`
    : `https://i.pravatar.cc/200?u=${encodeURIComponent(profile.$id || profile.username || profile.name || 'kalakar')}`;

  const profilePosts = mockPosts
    .filter((post) => !profile.$id || post.authorId === profile.$id || post.authorId === mockCurrentProfile.$id || post.authorId === 'user_aarav_actor')
    .slice(0, 3);

  const stats = {
    views: Number(profile.profileViews || 1240),
    impressions: Number(profile.impressions || 8390),
    posts: profilePosts.length
  };

  container.innerHTML = `
    <div class="view-header">
      <h2>Profile</h2>
    </div>
    <article class="card" style="padding: 20px;">
      <div style="display:flex; gap:16px; align-items:center;">
        <img src="${avatar}" alt="${escapeHtml(profile.name || 'User')}" style="width:84px; height:84px; border-radius:50%; object-fit:cover; border:1px solid var(--line);" />
        <div>
          <h3 style="margin:0;">${escapeHtml(profile.name || 'Kalakar User')}</h3>
          <p class="meta" style="margin:4px 0 0 0;">@${escapeHtml(profile.username || 'kalakar_user')}</p>
          <p class="meta" style="margin:4px 0 0 0;">${escapeHtml(profile.city || 'Mumbai')} • ${escapeHtml(profile.language || 'Marathi')}</p>
        </div>
      </div>
      <div style="margin-top:16px;">
        <h4 style="margin:0 0 6px 0;">About</h4>
        <p class="meta" style="margin:0;">${escapeHtml(profile.bio || 'No bio added yet.')}</p>
      </div>
      <div style="margin-top:12px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px;">
        <div class="card" style="padding:10px; margin:0;">
          <strong style="font-size:1rem;">${stats.views}</strong>
          <span class="meta">Views</span>
        </div>
        <div class="card" style="padding:10px; margin:0;">
          <strong style="font-size:1rem;">${stats.impressions}</strong>
          <span class="meta">Impressions</span>
        </div>
        <div class="card" style="padding:10px; margin:0;">
          <strong style="font-size:1rem;">${stats.posts}</strong>
          <span class="meta">Posts</span>
        </div>
      </div>
      <div style="margin-top:14px;">
        <div class="filter-bar" style="margin-bottom:10px;">
          <button class="filter-pill active">Posts</button>
          <button class="filter-pill">Credits</button>
          <button class="filter-pill">About</button>
        </div>
        <div style="display:grid; gap:10px;">
          ${profilePosts.map((post) => `
            <article class="card" style="padding:12px; margin:0;">
              <p style="margin:0;">${escapeHtml(post.contentText || post.content || '')}</p>
              <span class="meta">${formatRelativeTime(post.createdAt)} · ❤ ${post.likes || 0} · 💬 ${post.comments || 0}</span>
            </article>
          `).join('')}
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
