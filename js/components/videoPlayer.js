export function createVideoPlayer(containerEl, { videoUrl, thumbnailUrl, aspectRatio }) {
  const isVertical = aspectRatio === '9/16';
  containerEl.innerHTML = `
    <div class="video-player-wrapper" style="position: relative; width: 100%; aspect-ratio: ${isVertical ? '9/16' : '16/9'}; background: #111; overflow: hidden; border-radius: var(--radius-md);">
      ${thumbnailUrl ? `<img src="${thumbnailUrl}" class="video-poster" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover; z-index: 1;" />` : ''}
      <video loop playsinline muted style="position: absolute; top:0; left:0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s;" data-src="${videoUrl}" preload="none"></video>
      <div class="video-loading spinner hidden" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1;"></div>
      
      <div class="video-player__controls" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; display: flex; align-items: center; gap: 8px; z-index: 10; opacity: 0; transition: opacity 0.3s; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px); border-radius: 0 0 var(--radius-md) var(--radius-md);">
        <button class="player-play-btn icon-btn" style="color: white; border: none; background: transparent; cursor: pointer;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="player-progress-container" style="flex: 1; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; cursor: pointer; position: relative;">
          <div class="player-progress-bar" style="width: 0%; height: 100%; background: var(--brand-gold); border-radius: 2px; pointer-events: none;"></div>
        </div>
        <div class="player-time" style="color: white; font-size: 0.75rem; font-family: monospace; white-space: nowrap;">0:00 / 0:00</div>
        <button class="player-mute-btn icon-btn" style="color: white; border: none; background: transparent; cursor: pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path></svg>
        </button>
        <button class="player-fullscreen-btn icon-btn" style="color: white; border: none; background: transparent; cursor: pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
        </button>
      </div>

      <div class="tap-zone left-zone" style="position: absolute; left: 0; top: 0; width: 30%; height: 100%; z-index: 2;"></div>
      <div class="tap-zone center-zone" style="position: absolute; left: 30%; top: 0; width: 40%; height: 100%; z-index: 2;"></div>
      <div class="tap-zone right-zone" style="position: absolute; left: 70%; top: 0; width: 30%; height: 100%; z-index: 2;"></div>
    </div>
  `;

  const wrapper = containerEl.querySelector('.video-player-wrapper');
  const video = containerEl.querySelector('video');
  const controls = containerEl.querySelector('.video-player__controls');
  const playBtn = containerEl.querySelector('.player-play-btn');
  const muteBtn = containerEl.querySelector('.player-mute-btn');
  const fsBtn = containerEl.querySelector('.player-fullscreen-btn');
  const progressBar = containerEl.querySelector('.player-progress-bar');
  const progressContainer = containerEl.querySelector('.player-progress-container');
  const timeDisplay = containerEl.querySelector('.player-time');
  const poster = containerEl.querySelector('.video-poster');
  const spinner = containerEl.querySelector('.video-loading');

  const icons = {
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>',
    mute: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>',
    unmute: '<path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  let controlsTimeout;
  const showControls = () => {
    controls.style.opacity = '1';
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (!video.paused) controls.style.opacity = '0';
    }, 2500);
  };

  wrapper.addEventListener('mouseenter', showControls);
  wrapper.addEventListener('mousemove', showControls);
  wrapper.addEventListener('mouseleave', () => {
    if (!video.paused) controls.style.opacity = '0';
  });

  const togglePlay = () => {
    if (video.paused) {
      video.play().catch(e => console.log('Playback prevented', e));
    } else {
      video.pause();
    }
    showControls();
  };

  const toggleMute = () => {
    video.muted = !video.muted;
    muteBtn.querySelector('svg').innerHTML = video.muted ? icons.mute : icons.unmute;
  };

  containerEl.querySelector('.center-zone').addEventListener('click', togglePlay);
  playBtn.addEventListener('click', togglePlay);
  muteBtn.addEventListener('click', toggleMute);

  video.addEventListener('play', () => {
    playBtn.querySelector('svg').innerHTML = icons.pause;
    if (poster) poster.style.display = 'none';
    video.style.opacity = '1';
    controls.style.opacity = '1';
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => { controls.style.opacity = '0'; }, 2500);
  });

  video.addEventListener('pause', () => {
    playBtn.querySelector('svg').innerHTML = icons.play;
    controls.style.opacity = '1';
  });

  video.addEventListener('timeupdate', () => {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percent}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  });

  video.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `0:00 / ${formatTime(video.duration)}`;
  });

  video.addEventListener('waiting', () => {
    spinner.classList.remove('hidden');
  });

  video.addEventListener('playing', () => {
    spinner.classList.add('hidden');
  });

  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  });

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(err => {
        console.log("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  });

  // Double tap to skip 10s
  let lastTapR = 0;
  containerEl.querySelector('.right-zone').addEventListener('click', (e) => {
    const now = new Date().getTime();
    if (now - lastTapR < 300) {
      video.currentTime = Math.min(video.duration, video.currentTime + 10);
      showControls();
    }
    lastTapR = now;
  });

  let lastTapL = 0;
  containerEl.querySelector('.left-zone').addEventListener('click', (e) => {
    const now = new Date().getTime();
    if (now - lastTapL < 300) {
      video.currentTime = Math.max(0, video.currentTime - 10);
      showControls();
    }
    lastTapL = now;
  });

  // Lazy load src and autoplay observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!video.src) {
          video.src = video.dataset.src;
          video.load();
        }
        if (video.paused && entry.intersectionRatio > 0.6) {
          video.play().catch(e => console.log('Autoplay prevented', e));
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    });
  }, { rootMargin: '200px 0px', threshold: [0, 0.6] });

  observer.observe(wrapper);
}
