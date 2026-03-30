const feedElement = document.getElementById('video-feed');

const videos = [
  {
    id: 'v1',
    title: 'Monsoon Test Reel',
    meta: 'Aarav Patil • Cinematographer',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 'v2',
    title: 'Street Casting Mood',
    meta: 'Mira Kulkarni • Casting Director',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 'v3',
    title: 'Action Sequence Breakdown',
    meta: 'Raghav Deshmukh • Director',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  }
];

function renderFeed(items) {
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'feed-card';
    card.dataset.id = item.id;

    const video = document.createElement('video');
    video.className = 'feed-video';
    video.src = item.src;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'metadata';

    const overlay = document.createElement('div');
    overlay.className = 'feed-overlay';

    const title = document.createElement('h2');
    title.className = 'feed-title';
    title.textContent = item.title;

    const meta = document.createElement('p');
    meta.className = 'feed-meta';
    meta.textContent = item.meta;

    const actions = document.createElement('div');
    actions.className = 'feed-actions';

    const likeBtn = document.createElement('button');
    likeBtn.type = 'button';
    likeBtn.className = 'feed-btn';
    likeBtn.textContent = 'Like';

    const commentBtn = document.createElement('button');
    commentBtn.type = 'button';
    commentBtn.className = 'feed-btn';
    commentBtn.textContent = 'Comment';

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'feed-btn';
    shareBtn.textContent = 'Share';

    actions.append(likeBtn, commentBtn, shareBtn);
    overlay.append(title, meta, actions);
    card.append(video, overlay);
    fragment.append(card);
  });

  feedElement.append(fragment);
}

function setupAutoPlayOnScroll() {
  const allVideos = Array.from(document.querySelectorAll('.feed-video'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!(video instanceof HTMLVideoElement)) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          allVideos.forEach((v) => {
            if (v !== video) v.pause();
          });
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    {
      root: feedElement,
      threshold: [0.4, 0.65, 0.85]
    }
  );

  allVideos.forEach((video) => observer.observe(video));
}

renderFeed(videos);
setupAutoPlayOnScroll();
