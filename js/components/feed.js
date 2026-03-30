import { databases, storage, Query, ID, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';
import { createVideoPlayer } from './videoPlayer.js';

let isLoading = false;
let lastPostId = null;

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

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.posts,
      queries
    );

    console.log('Posts found in Appwrite:', response.documents.length);
    if (!append) greenroomFeed.innerHTML = '';

    if (response.documents.length === 0 && !append) {
      renderEmptyState();
      isLoading = false;
      return;
    }

    lastPostId = response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null;

    for (const post of response.documents) {
      try {
        const author = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.creators,
          post.authorId
        );

        const postCard = createPostCard(post, author);
        greenroomFeed.appendChild(postCard);

        if (post.videoFileId) {
          const videoUrl = storage.getFileView(BUCKETS.avatars, post.videoFileId).href;
          createVideoPlayer(postCard.querySelector('.post-video-container'), {
            videoUrl: videoUrl,
            aspectRatio: '16/9'
          });
        }
      } catch (postErr) {
        console.warn('Skipping post due to error (likely missing author):', post.$id, postErr);
      }
    }
  } catch (error) {
    console.error('Feed error:', error);
    if (!append) greenroomFeed.innerHTML = '<p class="text-center meta">Failed to load feed. Check console.</p>';
  } finally {
    isLoading = false;
  }
}

function createPostCard(post, author) {
  const card = document.createElement('div');
  card.className = 'post-card panel mb-4';
  card.innerHTML = `
    <div class="post-header" style="display:flex; gap:12px; align-items:center; padding:16px;">
      <img src="https://i.pravatar.cc/100?u=${author.$id}" class="user-avatar" style="width:40px; height:40px;">
      <div>
        <h4 style="font-size:0.95rem;">${author.name}</h4>
        <p class="meta" style="font-size:0.75rem;">${author.primaryCraft} · ${author.city}</p>
      </div>
    </div>
    <div class="post-content" style="padding:0 16px 16px 16px;">
      <p style="font-size:0.95rem; line-height:1.5;">${post.contentText}</p>
    </div>
    <div class="post-video-container"></div>
  `;
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
