import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, Query } from '../appwriteClient.js';

const feedEl = document.getElementById('feed');
const loaderEl = document.getElementById('feed-loader');
const errorEl = document.getElementById('feed-error');

const PAGE_SIZE = 6;
let isLoading = false;
let hasMore = true;
let lastCursor = null;

const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (!(video instanceof HTMLVideoElement)) return;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  },
  { threshold: [0.4, 0.7, 0.95] }
);

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

function buildMediaElement(post) {
  if (!post.mediaFileId) {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.textContent = 'No media attached for this post.';
    return placeholder;
  }

  const video = document.createElement('video');
  video.src = storage.getFileView(BUCKETS.POST_MEDIA, post.mediaFileId).href;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.controls = false;

  videoObserver.observe(video);
  return video;
}

function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  card.dataset.id = post.$id;

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'media-wrap';
  mediaWrap.appendChild(buildMediaElement(post));

  const content = document.createElement('div');
  content.className = 'post-content';

  const meta = document.createElement('div');
  meta.className = 'meta';

  const creator = document.createElement('span');
  creator.textContent = post.creatorId || 'Unknown creator';

  const date = document.createElement('span');
  date.textContent = new Date(post.createdAt || post.$createdAt).toLocaleDateString();

  meta.appendChild(creator);
  meta.appendChild(date);

  const text = document.createElement('p');
  text.className = 'post-text';
  text.textContent = post.content || '';

  const actions = document.createElement('div');
  actions.className = 'actions';

  const likeBtn = document.createElement('button');
  likeBtn.type = 'button';
  likeBtn.className = 'action-btn';
  likeBtn.setAttribute('aria-pressed', 'false');
  likeBtn.textContent = `Like (${post.likeCount || 0})`;

  likeBtn.addEventListener('click', () => {
    const pressed = likeBtn.getAttribute('aria-pressed') === 'true';
    const nextPressed = !pressed;

    let count = Number(post.likeCount || 0);
    count = nextPressed ? count + 1 : Math.max(0, count - 1);
    post.likeCount = count;

    likeBtn.setAttribute('aria-pressed', String(nextPressed));
    likeBtn.textContent = `Like (${count})`;
  });

  const commentBtn = document.createElement('button');
  commentBtn.type = 'button';
  commentBtn.className = 'action-btn';
  commentBtn.textContent = 'Comment';
  commentBtn.addEventListener('click', () => {
    alert('Comment composer can be opened here.');
  });

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'action-btn';
  shareBtn.textContent = 'Share';
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'Kalakar Post',
      text: post.content || 'Check this post on Kalakar',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) {}
      return;
    }

    const urlToCopy = window.location.href;
    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        copied = true;
      } catch (_) {}
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = urlToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (_) {
        copied = false;
      }
    }

    shareBtn.textContent = copied ? 'Copied' : 'Link Ready';
    setTimeout(() => {
      shareBtn.textContent = 'Share';
    }, 1200);
  });

  actions.appendChild(likeBtn);
  actions.appendChild(commentBtn);
  actions.appendChild(shareBtn);

  content.appendChild(meta);
  content.appendChild(text);
  content.appendChild(actions);

  card.appendChild(mediaWrap);
  card.appendChild(content);

  return card;
}

async function fetchPosts() {
  if (isLoading || !hasMore) return;

  isLoading = true;
  loaderEl.classList.remove('hidden');
  clearError();

  try {
    const queries = [Query.orderDesc('createdAt'), Query.limit(PAGE_SIZE)];
    if (lastCursor) {
      queries.push(Query.cursorAfter(lastCursor));
    }

    const result = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, queries);
    const docs = result.documents || [];

    docs.forEach((doc) => {
      feedEl.appendChild(createPostCard(doc));
    });

    if (docs.length < PAGE_SIZE) {
      hasMore = false;
      loaderEl.textContent = 'You are all caught up.';
    } else {
      lastCursor = docs[docs.length - 1].$id;
      loaderEl.classList.add('hidden');
    }
  } catch (error) {
    showError(error?.message || 'Failed to load feed.');
    loaderEl.classList.add('hidden');
  } finally {
    isLoading = false;
  }
}

const sentinelObserver = new IntersectionObserver((entries) => {
  if (entries.some((entry) => entry.isIntersecting)) {
    fetchPosts();
  }
});

sentinelObserver.observe(loaderEl);
fetchPosts();
