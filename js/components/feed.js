import { StorageServiceInstance as StorageService } from './core.js';
import { openTalentProfile } from './network.js';
import { openChat, renderChatList } from './chat.js';
import { createVideoPlayer } from './videoPlayer.js';
import { openPostComposer } from './postComposer.js';

const greenroomFeed = document.querySelector('#greenroom-feed');
const uploaderModal = document.querySelector('#uploader-modal');
const openUploadBtn = document.querySelector('.post-input-btn');
const closeUploadBtn = document.querySelector('#close-uploader-btn');
const fileInput = document.querySelector('#file-input');
const uploadArea = document.querySelector('#drop-zone');
const uploadingState = document.querySelector('#uploading-state');
const uploadProgress = document.querySelector('#upload-progress');

export async function renderStage() {
  // Update Filter Tabs active state
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      // Re-trigger render based on filter
      renderPosts(e.target.textContent);
    });
  });

  // Handle Create Post button
  if (openUploadBtn) {
    openUploadBtn.addEventListener('click', () => {
      openPostComposer();
    });
  }

  // Handle Weekly Prompt CTA
  const promptCta = document.querySelector('.prompt-banner__cta');
  if (promptCta) {
    promptCta.addEventListener('click', () => {
      openPostComposer();
      setTimeout(() => {
        const promptToggle = document.getElementById('composer-link-prompt');
        if(promptToggle) promptToggle.checked = true;
      }, 100);
    });
  }

  renderPosts('For You');
}

async function renderPosts(filterTopic) {
  greenroomFeed.innerHTML = '';

  // Skeleton Loaders
  greenroomFeed.innerHTML = `
    <div class="video-slot panel mb-4" style="padding: 16px;">
      <div class="skeleton" style="height: 48px; width: 100%; margin-bottom: 12px;"></div>
      <div class="skeleton" style="height: 400px; width: 100%; margin-bottom: 12px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 60px; width: 100%;"></div>
    </div>
    <div class="video-slot panel mb-4" style="padding: 16px;">
      <div class="skeleton" style="height: 48px; width: 100%; margin-bottom: 12px;"></div>
      <div class="skeleton" style="height: 400px; width: 100%; margin-bottom: 12px; border-radius: var(--radius-md);"></div>
      <div class="skeleton" style="height: 60px; width: 100%;"></div>
    </div>
  `;

  // Simulate network delay
  setTimeout(() => {
    greenroomFeed.innerHTML = '';

    const creators = StorageService.get('kalakar_creators') || [];
    
    // Mock user posts based on existing creator profiles
    const mockPosts = [
      {
        id: 'p1',
        author: creators[0] || { name: 'Ishaan Verma', role: 'Actor', city: 'Mumbai', verified: true, reliability: 98 },
        videoUrl: 'https://cdn.pixabay.com/video/2016/09/21/5412-183786498_large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
        caption: "Practicing the new monologue for City of Dust. Let me know what you think! #Acting #Monologue",
        applaudCount: 24,
        commentCount: 5,
        shareCount: 3,
        createdAt: Date.now() - 3600000 * 2
      },
      {
        id: 'p2',
        author: creators[1] || { name: 'Alisha Rao', role: 'Cinematographer', city: 'Pune', verified: true, reliability: 92 },
        videoUrl: 'https://cdn.pixabay.com/video/2015/08/08/212-135732739_large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1533750516457-47f0171bb3ee?auto=format&fit=crop&w=800&q=80',
        caption: "Testing the new RED V-Raptor setup in low light. The shadows roll off beautifully. #Cinematography #Camera",
        applaudCount: 42,
        commentCount: 8,
        shareCount: 1,
        createdAt: Date.now() - 3600000 * 5
      }
    ];

    // Combine with newly created local posts
    const localPosts = JSON.parse(localStorage.getItem('kalakar_posts') || '[]');
    const allPosts = [...localPosts, ...mockPosts];

    if (allPosts.length === 0) {
      greenroomFeed.innerHTML = `
        <div class="empty-state text-center" style="padding: 40px; border: 1px dashed var(--line); border-radius: 12px;">
          <h3 style="margin-bottom: 8px;">The Stage is empty.</h3>
          <p class="meta" style="margin-bottom: 16px;">Be the first to share your craft!</p>
          <button class="primary action-gold create-post-empty-btn">Create Post</button>
        </div>
      `;
      document.querySelector('.create-post-empty-btn').addEventListener('click', openPostComposer);
      return;
    }

    allPosts.forEach(post => {
      // Setup the Post Card
      const postCard = document.createElement('div');
      postCard.className = 'post-card panel mb-4';
      postCard.style.padding = '16px';
      postCard.style.position = 'relative';

      // Author Header
      const header = document.createElement('div');
      header.className = 'post-header';
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.marginBottom = '12px';
      
      const authorId = post.author?.id || post.authorId;
      const authorObj = post.author || creators.find(c => c.id === authorId) || { name: 'You', role: 'Artist', city: 'Unknown', verified: true };

      header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(authorObj.name)}" class="user-avatar" style="width: 48px; height: 48px; border-radius: 50%;" alt="Avatar">
          <div class="creator-info" style="margin: 0;">
            <div class="creator-name" style="font-size: 1.05rem; font-weight: 700;">
              ${authorObj.name} 
              ${authorObj.verified ? '<span class="verified-icon" title="Verified Professional" style="color:var(--brand-gold);">★</span>' : ''}
              <span class="vouch-badge" style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--brand-gold); margin-left: 8px;">CINTAA</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--muted); margin:0;">${authorObj.role} · ${authorObj.city} · 2h</p>
          </div>
        </div>
        <button class="ghost small connect-btn" style="border-radius: 20px; padding: 6px 16px;">Connect</button>
      `;
      postCard.appendChild(header);

      // Video Player Container
      const videoContainer = document.createElement('div');
      videoContainer.className = 'post-video-container';
      videoContainer.style.marginBottom = '12px';
      postCard.appendChild(videoContainer);

      // Caption
      const captionEl = document.createElement('div');
      captionEl.className = 'post-caption';
      captionEl.style.fontSize = '0.95rem';
      captionEl.style.marginBottom = '16px';
      captionEl.style.lineHeight = '1.5';
      
      const hashtagsColored = post.caption || post.contentText || '';
      captionEl.innerHTML = hashtagsColored.replace(/(#[a-zA-Z0-9]+)/g, '<span style="color: var(--brand-gold); cursor:pointer;">$1</span>');
      postCard.appendChild(captionEl);

      // Actions Row
      const actions = document.createElement('div');
      actions.className = 'post-actions';
      actions.style.display = 'flex';
      actions.style.gap = '16px';
      actions.style.borderTop = '1px solid var(--line)';
      actions.style.paddingTop = '12px';

      actions.innerHTML = `
        <button class="post-action-btn action-applaud" data-id="${post.id}" style="background:transparent; border:none; color:var(--text); cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
          <span class="icon">👏</span> <span class="count">${post.applaudCount || 0}</span>
        </button>
        <button class="post-action-btn action-comment" style="background:transparent; border:none; color:var(--text); cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
          <span class="icon">💬</span> <span>${post.commentCount || 0}</span>
        </button>
        <button class="post-action-btn action-share" style="background:transparent; border:none; color:var(--text); cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
          <span class="icon">🔁</span> <span>${post.shareCount || 0}</span>
        </button>
        <button class="post-action-btn action-save" style="margin-left:auto; background:transparent; border:none; color:var(--text); cursor:pointer; display:flex; align-items:center; gap:6px; font-weight:500;">
          <span class="icon">📌</span> <span>Save</span>
        </button>
      `;
      postCard.appendChild(actions);

      greenroomFeed.appendChild(postCard);

      // Initialize Video Player instances
      if (post.videoUrl) {
        createVideoPlayer(videoContainer, {
          videoUrl: post.videoUrl,
          thumbnailUrl: post.thumbnailUrl,
          aspectRatio: '16/9' // hardcoded or dynamic based on post type
        });
      }

      // Applaud toggle logic
      const applaudBtn = postCard.querySelector('.action-applaud');
      let applauded = false;
      applaudBtn.addEventListener('click', function() {
        applauded = !applauded;
        const countSpan = this.querySelector('.count');
        let current = parseInt(countSpan.textContent);
        if (applauded) {
          this.style.color = 'var(--brand-gold)';
          countSpan.textContent = current + 1;
        } else {
          this.style.color = 'var(--text)';
          countSpan.textContent = current - 1;
        }
      });
      
      const saveBtn = postCard.querySelector('.action-save');
      let saved = false;
      saveBtn.addEventListener('click', function() {
        saved = !saved;
        if (saved) {
          this.style.color = 'var(--brand-gold)';
          this.querySelector('span:last-child').textContent = 'Saved';
        } else {
          this.style.color = 'var(--text)';
          this.querySelector('span:last-child').textContent = 'Save';
        }
      });
    });

  }, 800);
}

export function renderTrendingWidget() {
  // Unchanged from original setup or omit if not required
}

// Ensure initPostComposer is called when app loads
document.addEventListener('DOMContentLoaded', () => {
  import('./postComposer.js').then(module => {
    module.initPostComposer();
  });
});
