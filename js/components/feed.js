import { databases, Query, APPWRITE_CONFIG, storage } from '../appwriteClient.js';
import { openTalentProfile } from './network.js';
import { createVideoPlayer } from './videoPlayer.js';
import { openPostComposer } from './postComposer.js';

const greenroomFeed = document.querySelector('#greenroom-feed');
const openUploadBtn = document.querySelector('.post-input-btn');
const promptCta = document.querySelector('.prompt-banner__cta');

let lastPostId = null;
let isLoading = false;
let currentFilter = 'For You';

export async function renderStage() {
  // Update Filter Tabs active state
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.textContent;
      lastPostId = null; // Reset pagination
      renderPosts(currentFilter);
    });
  });

  // Handle Create Post button
  if (openUploadBtn) {
    openUploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPostComposer();
    });
  }

  // Handle Weekly Prompt CTA
  if (promptCta) {
    promptCta.addEventListener('click', () => {
      openPostComposer();
      setTimeout(() => {
        const promptToggle = document.getElementById('composer-link-prompt');
        if(promptToggle) promptToggle.checked = true;
      }, 100);
    });
  }

  // Infinite Scroll Observer
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && lastPostId) {
      renderPosts(currentFilter, true);
    }
  }, { threshold: 0.5 });

  const sentinel = document.createElement('div');
  sentinel.id = 'feed-sentinel';
  greenroomFeed.after(sentinel);
  observer.observe(sentinel);

  renderPosts('For You');
  renderTrendingWidget();
  renderWeeklyPrompt();
}

async function renderPosts(filterTopic, append = false) {
  if (isLoading) return;
  isLoading = true;

  if (!append) {
    greenroomFeed.innerHTML = '';
    showSkeletons();
  }

  try {
    const queries = [
      Query.limit(10),
      Query.orderDesc('createdAt')
    ];

    if (lastPostId) {
      queries.push(Query.cursorAfter(lastPostId));
    }

    // Role-based filtering
    const roleFilters = ['Actors', 'Cinematographers', 'Editors', 'Directors'];
    if (roleFilters.includes(filterTopic)) {
      // In a real app, you'd filter by the author's role. 
      // This requires a join or storing role on the post.
      // For now, we'll assume the post has a 'category' attribute matching the filter.
      queries.push(Query.equal('category', filterTopic.toLowerCase().slice(0, -1)));
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.posts,
      queries
    );

    if (!append) greenroomFeed.innerHTML = '';

    if (response.documents.length === 0 && !append) {
      renderEmptyState();
      isLoading = false;
      return;
    }

    lastPostId = response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null;

    for (const post of response.documents) {
      // Fetch Author Details
      const author = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.creators,
        post.authorId
      );

      const postCard = createPostCard(post, author);
      greenroomFeed.appendChild(postCard);

      // Init Video
      if (post.videoFileId) {
        const videoUrl = storage.getFileView(APPWRITE_CONFIG.buckets.avatars, post.videoFileId).href;
        const thumbUrl = post.thumbnailFileId ? 
            storage.getFilePreview(APPWRITE_CONFIG.buckets.avatars, post.thumbnailFileId, 400).href : '';
            
        createVideoPlayer(postCard.querySelector('.post-video-container'), {
          videoUrl: videoUrl,
          thumbnailUrl: thumbUrl,
          aspectRatio: '9/16'
        });
      }
    }
  } catch (error) {
    console.error('Feed error:', error);
    if (!append) greenroomFeed.innerHTML = '<p class="text-center meta">Failed to load feed. Check connection.</p>';
  } finally {
    isLoading = false;
  }
}

function createPostCard(post, author) {
  const card = document.createElement('div');
  card.className = 'post-card panel mb-4';
  card.style.padding = '16px';

  const avatarUrl = author.avatarFileId ? 
    storage.getFilePreview(APPWRITE_CONFIG.buckets.avatars, author.avatarFileId, 100).href : 
    `https://i.pravatar.cc/100?u=${author.$id}`;

  card.innerHTML = `
    <div class="post-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 12px; cursor:pointer;" class="author-link" data-id="${author.$id}">
        <img src="${avatarUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 700;">${author.name} ${author.isVerified ? '<span style="color:var(--brand-gold);">★</span>' : ''}</div>
          <p class="meta" style="font-size: 0.8rem;">${author.primaryCraft} · ${author.city}</p>
        </div>
      </div>
      <button class="ghost small" style="border-radius: 20px;">Follow</button>
    </div>
    <div class="post-video-container" style="margin-bottom: 12px; background: #000; border-radius: 12px; overflow: hidden; min-height: 400px;"></div>
    <div class="post-caption" style="font-size: 0.95rem; margin-bottom: 16px; line-height: 1.5;">
      ${(post.contentText || '').replace(/(#[a-zA-Z0-9]+)/g, '<span style="color: var(--brand-gold);">$1</span>')}
    </div>
    <div class="post-actions" style="display: flex; gap: 20px; border-top: 1px solid var(--line); padding-top: 12px;">
      <button class="post-action-btn" style="background:none; border:none; color:var(--text); cursor:pointer;"><span class="icon">👏</span> ${post.applaudCount || 0}</button>
      <button class="post-action-btn" style="background:none; border:none; color:var(--text); cursor:pointer;"><span class="icon">💬</span> ${post.commentCount || 0}</button>
      <button class="post-action-btn" style="background:none; border:none; color:var(--text); cursor:pointer;"><span class="icon">🚀</span></button>
      <button class="post-action-btn" style="margin-left:auto; background:none; border:none; color:var(--text); cursor:pointer;"><span class="icon">📌</span></button>
    </div>
  `;

  card.querySelector('.author-link').addEventListener('click', () => openTalentProfile(author.$id));
  return card;
}

function showSkeletons() {
  for (let i = 0; i < 2; i++) {
    const s = document.createElement('div');
    s.className = 'post-card panel mb-4';
    s.style.padding = '16px';
    s.innerHTML = `
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
        <div style="flex:1;"><div class="skeleton" style="height: 16px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton" style="height: 12px; width: 25%;"></div></div>
      </div>
      <div class="skeleton" style="height: 400px; width: 100%; border-radius: 12px; margin-bottom: 12px;"></div>
      <div class="skeleton" style="height: 20px; width: 80%; margin-bottom: 8px;"></div>
    `;
    greenroomFeed.appendChild(s);
  }
}

function renderEmptyState() {
  greenroomFeed.innerHTML = `
    <div class="empty-state text-center" style="padding: 60px 20px;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🎥</div>
      <h3 style="margin-bottom: 8px;">The Stage is yours.</h3>
      <p class="meta" style="margin-bottom: 24px;">Be the first to upload a masterclass or performance reel.</p>
      <button class="primary action-gold" id="empty-feed-post-btn">Upload First Video</button>
    </div>
  `;
  document.getElementById('empty-feed-post-btn')?.addEventListener('click', openPostComposer);
}

export async function renderTrendingWidget() {
  const container = document.querySelector('#trending-talents-list');
  if (!container) return;

  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.creators,
      [Query.limit(5), Query.orderDesc('vouchCount')]
    );

    container.innerHTML = '';
    response.documents.forEach((talent, i) => {
      const item = document.createElement('div');
      item.className = 'trending-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.padding = '12px 0';
      item.style.borderBottom = i === response.documents.length - 1 ? 'none' : '1px solid var(--line)';
      item.style.cursor = 'pointer';

      const avatar = talent.avatarFileId ? 
        storage.getFilePreview(APPWRITE_CONFIG.buckets.avatars, talent.avatarFileId, 80).href : 
        `https://i.pravatar.cc/80?u=${talent.$id}`;

      item.innerHTML = `
        <div style="font-weight: 700; color: var(--brand-gold); min-width: 24px;">#${i + 1}</div>
        <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
        <div style="flex:1; overflow:hidden;">
          <div style="font-weight: 600; font-size: 0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${talent.name}</div>
          <div class="meta" style="font-size: 0.75rem;">${talent.primaryCraft}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: 700; color: var(--success); font-size: 0.8rem;">${talent.vouchCount || 0}</div>
          <div class="meta" style="font-size: 0.65rem;">Vouches</div>
        </div>
      `;
      item.addEventListener('click', () => openTalentProfile(talent.$id));
      container.appendChild(item);
    });
  } catch (error) {
    console.error('Trending error:', error);
  }
}

async function renderWeeklyPrompt() {
  const titleEl = document.querySelector('.prompt-banner__title');
  const detailsEl = document.querySelector('.prompt-banner__details');
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.weeklyPrompts,
      [Query.limit(1), Query.orderDesc('createdAt')]
    );

    if (response.documents.length > 0) {
      const prompt = response.documents[0];
      if (titleEl) titleEl.textContent = prompt.title;
      if (detailsEl) detailsEl.textContent = prompt.description;
    }
  } catch (error) {
    // Keep defaults
  }
}
