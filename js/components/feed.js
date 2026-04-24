import { databases, storage, Query, ID, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';
import { createVideoPlayer } from './videoPlayer.js';
import { mockPosts, getUserById, formatRelativeTime } from '../mockData.js';

let isLoading = false;
let lastPostId = null;
const POSTS_COLLECTION = COLLECTIONS.POSTS || COLLECTIONS.posts;
const CREATORS_COLLECTION = COLLECTIONS.CREATORS || COLLECTIONS.creators;
const VIDEO_BUCKET = BUCKETS.POST_MEDIA || BUCKETS.post_media || BUCKETS.AVATARS || BUCKETS.avatars;

export async function renderStage(filterTopic = 'For You') {
  const container = document.querySelector('#feed-view');
  if (!container) return;

  const greenroomFeed = document.querySelector('#greenroom-feed');
  if (!greenroomFeed) {
      console.warn('Feed target #greenroom-feed not found');
      return;
  }

  // Setup infinite scroll sentinel
  let sentinel = document.querySelector('#feed-sentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.id = 'feed-sentinel';
    sentinel.style.height = '20px';
    greenroomFeed.after(sentinel);
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && lastPostId) {
        renderPosts(filterTopic, true);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinel);
  }

  renderPosts(filterTopic);
}

async function renderPosts(filterTopic, append = false) {
  const greenroomFeed = document.querySelector('#greenroom-feed');
  if (!greenroomFeed) return;

  console.log('Fetching posts for:', filterTopic);
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
    if (append && lastPostId) {
      queries.push(Query.cursorAfter(lastPostId));
    }

    const response = await databases.listDocuments(DATABASE_ID, POSTS_COLLECTION, queries);

    console.log('Posts found in Appwrite:', response.documents.length);
    if (!append) greenroomFeed.innerHTML = '';

    if (response.documents.length === 0 && !append) {
      renderMockFeed();
      isLoading = false;
      return;
    }

    lastPostId = response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null;

    for (const post of response.documents) {
      try {
        let author = {
          $id: post.authorId || 'unknown',
          name: 'Kalakar Creator',
          primaryCraft: 'Artist',
          city: 'Maharashtra'
        };

        if (post.authorId) {
          try {
            author = await databases.getDocument(DATABASE_ID, CREATORS_COLLECTION, post.authorId);
          } catch (_) {}
        }

        const postCard = createPostCard(post, author, false);
        greenroomFeed.appendChild(postCard);

        if (post.videoFileId) {
          const videoUrl = storage.getFileView(VIDEO_BUCKET, post.videoFileId).href;
          createVideoPlayer(postCard.querySelector('.post-video-container'), {
            videoUrl: videoUrl,
            aspectRatio: '16/9'
          });
        }
      } catch (postErr) {
        console.warn('Skipping broken post:', post?.$id);
      }
    }
  } catch (error) {
    console.warn('Feed fallback to mock data.');
    if (!append) renderMockFeed();
  } finally {
    isLoading = false;
  }
}

function createPostCard(post, author, isMock = false) {
  const timeText = post.createdAt ? formatRelativeTime(post.createdAt) : 'Now';
  const likes = Number(post.likes || post.likeCount || 0);
  const comments = Number(post.comments || post.commentCount || 0);
  const postId = String(post.$id || `${author.$id}_${timeText}`);

  const card = document.createElement('div');
  card.className = 'post-card panel mb-4';
  card.innerHTML = `
    <div class="post-header" style="display:flex; gap:12px; align-items:center; padding:16px;">
      <img src="https://i.pravatar.cc/100?u=${author.$id}" class="user-avatar" style="width:40px; height:40px;">
      <div>
        <h4 style="font-size:0.95rem;">${author.name}</h4>
        <p class="meta" style="font-size:0.75rem;">${author.primaryCraft} · ${author.city} · ${timeText}</p>
      </div>
    </div>
    <div class="post-content" style="padding:0 16px 16px 16px;">
      <p style="font-size:0.95rem; line-height:1.5;">${escapeHtml(post.contentText || post.content || '')}</p>
    </div>
    <div class="post-video-container">${isMock ? '<div class="video-thumb-placeholder" style="aspect-ratio:16/9; border-radius:12px; border:1px solid var(--line); background:linear-gradient(160deg,#2b2b2b,#141414); display:flex; align-items:center; justify-content:center; color:var(--muted); font-size:0.85rem;">Video Reel Preview</div>' : ''}</div>
    <div class="post-meta-row" style="display:flex; gap:16px; padding:12px 16px 8px 16px; color:var(--muted); font-size:0.8rem;">
      <button class="post-like-btn" data-post-id="${postId}" data-liked="0" data-count="${likes}" style="background:transparent; border:1px solid var(--line); color:var(--muted); border-radius:18px; padding:6px 10px; cursor:pointer; display:flex; align-items:center; gap:6px;">
        <span aria-hidden="true">❤</span><span class="like-count">${likes}</span>
      </button>
      <button class="post-comment-btn" data-post-id="${postId}" style="background:transparent; border:1px solid var(--line); color:var(--muted); border-radius:18px; padding:6px 10px; cursor:pointer; display:flex; align-items:center; gap:6px;">
        <span aria-hidden="true">💬</span><span>${comments}</span>
      </button>
    </div>
    <div class="post-comments-panel hidden" data-post-comments="${postId}" style="padding: 0 16px 14px 16px;">
      ${renderMockComments(author.name)}
    </div>
  `;

  attachPostInteractions(card);
  return card;
}

function showSkeletons() {
  const greenroomFeed = document.querySelector('#greenroom-feed');
  const skeleton = `<div class="skeleton-card" style="height:200px; background:var(--surface); border-radius:12px; margin-bottom:16px;"></div>`;
  greenroomFeed.innerHTML = skeleton.repeat(3);
}

function renderEmptyState() {
  const greenroomFeed = document.querySelector('#greenroom-feed');
  greenroomFeed.innerHTML = `
    <div class="empty-state text-center" style="padding:40px 20px;">
      <p class="meta">No posts found for this category yet.</p>
    </div>
  `;
}

function renderMockFeed() {
  const greenroomFeed = document.querySelector('#greenroom-feed');
  if (!greenroomFeed) return;

  greenroomFeed.innerHTML = '';
  mockPosts.slice(0, 8).forEach((post) => {
    const author = getUserById(post.authorId) || {
      $id: post.authorId || 'mock_author',
      name: 'Kalakar Creator',
      primaryCraft: 'Artist',
      city: 'Mumbai'
    };
    const card = createPostCard(post, author, true);
    greenroomFeed.appendChild(card);
  });
}

function attachPostInteractions(card) {
  const likeBtn = card.querySelector('.post-like-btn');
  const commentBtn = card.querySelector('.post-comment-btn');

  likeBtn?.addEventListener('click', () => {
    const countEl = likeBtn.querySelector('.like-count');
    const currentCount = Number(likeBtn.dataset.count || 0);
    const isLiked = likeBtn.dataset.liked === '1';
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    likeBtn.dataset.liked = nextLiked ? '1' : '0';
    likeBtn.dataset.count = String(nextCount);
    if (countEl) countEl.textContent = String(nextCount);
    likeBtn.style.color = nextLiked ? '#F87171' : 'var(--muted)';
    likeBtn.style.borderColor = nextLiked ? 'rgba(248,113,113,0.5)' : 'var(--line)';
    animateTap(likeBtn);
  });

  commentBtn?.addEventListener('click', () => {
    const postId = commentBtn.dataset.postId;
    const panel = card.querySelector(`[data-post-comments="${postId}"]`);
    if (!panel) return;
    panel.classList.toggle('hidden');
    animateTap(commentBtn);
  });
}

function animateTap(button) {
  if (!button || typeof button.animate !== 'function') return;
  button.animate(
    [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.92)', opacity: 0.82 },
      { transform: 'scale(1.06)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    { duration: 220, easing: 'ease-out' }
  );
}

function renderMockComments(authorName) {
  const safeAuthor = escapeHtml(authorName || 'Creator');
  return `
    <div style="display:grid; gap:8px; border-top:1px solid var(--line); padding-top:10px;">
      <div style="font-size:0.82rem; color:var(--text);"><strong>Priya Nair</strong> Loved this energy! 🎬</div>
      <div style="font-size:0.82rem; color:var(--text);"><strong>Vikram Rao</strong> Great expression control, ${safeAuthor}.</div>
      <div style="font-size:0.82rem; color:var(--text);"><strong>Meera Shah</strong> Would love to collaborate on a short.</div>
    </div>
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
