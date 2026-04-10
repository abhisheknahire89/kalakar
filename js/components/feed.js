import { listFeedPosts, togglePostReaction, getRelativeTime, getProfileSnapshot } from '../services/appData.js';
import { getFilePreviewUrl, BUCKETS } from '../appwriteClient.js';
import { openPostComposer } from './postComposer.js';
import { openHireFlow } from './chat.js';
import { renderProfile } from './profile.js';
import { showToast } from './toast.js';

let feedBound = false;

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMedia(post) {
  if (!post.mediaUrl) return '';

  if (post.mediaType === 'image') {
    return `
      <div class="beta-post-media">
        <img src="${post.mediaUrl}" alt="Post by ${escapeHtml(post.author?.name || 'creator')}" loading="lazy" />
      </div>
    `;
  }

  if (post.mediaType === 'video') {
    return `
      <div class="beta-post-media beta-post-media-video">
        <video src="${post.mediaUrl}" playsinline controls preload="metadata"></video>
      </div>
    `;
  }

  return '';
}

function createPostMarkup(post) {
  return `
    <article class="beta-post-card panel" data-post-id="${post.$id}">
      <button class="beta-post-header" data-action="profile" data-profile-id="${post.author?.$id || ''}">
        <img class="beta-avatar" src="${post.author?.avatarUrl || ''}" alt="${escapeHtml(post.author?.name || 'Creator')}" />
        <div class="beta-post-meta">
          <div class="beta-post-name-row">
            <strong>${escapeHtml(post.author?.name || 'Kalakar Creator')}</strong>
            <span class="beta-chip">${escapeHtml(post.author?.primaryCraft || post.author?.role || 'Creator')}</span>
          </div>
          <div class="beta-post-subtitle">${escapeHtml(post.author?.city || 'India')} · ${getRelativeTime(post.createdAt || post.$createdAt)}</div>
        </div>
      </button>

      ${post.contentText ? `<p class="beta-post-caption">${escapeHtml(post.contentText)}</p>` : ''}
      ${renderMedia(post)}

      <div class="beta-post-actions">
        <button class="beta-action-btn ${post.liked ? 'active' : ''}" data-action="like">Like <span>${post.likeCount + (post.liked ? 1 : 0)}</span></button>
        <button class="beta-action-btn" data-action="comment">Comment <span>${post.commentCount}</span></button>
        <button class="beta-action-btn" data-action="share">Share <span>${post.shareCount}</span></button>
        <button class="beta-action-btn ${post.saved ? 'active' : ''}" data-action="save">Save <span>${post.saveCount + (post.saved ? 1 : 0)}</span></button>
        <button class="beta-action-btn beta-action-btn-gold" data-action="hire" data-profile-id="${post.author?.$id || ''}">Hire</button>
      </div>
    </article>
  `;
}

function ensureBindings() {
  if (feedBound) return;
  feedBound = true;

  document.getElementById('feed-view')?.addEventListener('click', async (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) return;

    const postCard = event.target.closest('[data-post-id]');
    const postId = postCard?.dataset.postId;
    const action = actionButton.dataset.action;

    if (action === 'like' || action === 'save') {
      togglePostReaction(postId, action === 'like' ? 'liked' : 'saved');
      await renderStage();
      return;
    }

    if (action === 'share') {
      showToast('Share sheet coming next. Link copied soon for beta.', 'info');
      return;
    }

    if (action === 'comment') {
      showToast('Comments are opening soon. Your post actions are wired and ready.', 'info');
      return;
    }

    if (action === 'hire') {
      event.preventDefault();
      await openHireFlow(actionButton.dataset.profileId);
      return;
    }

    if (action === 'profile') {
      await renderProfile(actionButton.dataset.profileId);
      window.location.hash = '#profile';
    }
  });

  document.querySelectorAll('.post-input-btn, #open-upload-btn-mobile').forEach((node) => {
    if (node.dataset.boundComposer === '1') return;
    node.dataset.boundComposer = '1';
    node.addEventListener('click', (event) => {
      event.preventDefault();
      openPostComposer();
    });
  });
}

export async function renderStage() {
  ensureBindings();
  const container = document.getElementById('feed-view');
  if (!container) return;

  const currentProfile = getProfileSnapshot();
  const posts = await listFeedPosts();

  container.innerHTML = `
    <section class="beta-feed-shell">
      <div class="beta-feed-toolbar">
        <div>
          <p class="beta-kicker">Stage</p>
          <h2>Creator feed</h2>
        </div>
        <button class="ghost small" id="feed-compose-inline">Create</button>
      </div>

      <button class="beta-compose-card panel" id="feed-compose-card">
        <img class="beta-avatar" src="${currentProfile?.avatarFileId ? getFilePreviewUrl(BUCKETS.AVATARS || BUCKETS.avatars, currentProfile.avatarFileId) : `https://i.pravatar.cc/120?u=${encodeURIComponent(currentProfile?.$id || 'kalakar')}`}" alt="Your profile" />
        <div>
          <strong>Share your next move</strong>
          <p class="meta">Video-first, image-friendly, and built for hiring momentum.</p>
        </div>
      </button>

      <div class="beta-filter-row">
        <span class="beta-filter-pill active">For you</span>
        <span class="beta-filter-pill">Video</span>
        <span class="beta-filter-pill">Casting</span>
        <span class="beta-filter-pill">Collabs</span>
      </div>

      <div class="beta-post-list">
        ${posts.length ? posts.map(createPostMarkup).join('') : `
          <div class="beta-empty panel">
            <h3>Your stage is ready</h3>
            <p class="meta">Publish the first post and Kalakar will shape the feed around your work.</p>
          </div>
        `}
      </div>
    </section>
  `;

  document.getElementById('feed-compose-card')?.addEventListener('click', openPostComposer);
  document.getElementById('feed-compose-inline')?.addEventListener('click', openPostComposer);
}
