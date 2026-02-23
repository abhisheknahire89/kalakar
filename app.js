import { StorageServiceInstance as StorageService, setLanguage, setView } from './js/components/core.js';
import { checkOnboarding } from './js/components/auth.js';
import { renderStage, renderTrendingWidget } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList } from './js/components/chat.js';

window.StorageService = StorageService; 

document.addEventListener('DOMContentLoaded', () => {
  try {
    const loadingPhrases = ["Setting the Stage...", "Rolling Camera...", "Finding your Crew..."];
    let phraseIndex = 0;
    const phraseEl = document.getElementById('loading-phrase');
    const phraseInterval = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      if (phraseEl) phraseEl.textContent = loadingPhrases[phraseIndex];
    }, 500);

    setTimeout(() => { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); }, 1200);

    setTimeout(() => {
      clearInterval(phraseInterval);
      const splash = document.getElementById('splash-screen');
      if (splash) splash.style.display = 'none';

      window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          const authScreen = document.getElementById('auth-screen');
          if (authScreen) authScreen.style.display = 'flex';
        } else {
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('identity-gate-modal').style.display = 'none';
          renderStage();
        }
      });
    }, 1500);
  } catch (error) {
    console.error("Splash Screen Error: ", error);
  }
});

window.kalakarVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (!video || video.tagName !== 'VIDEO') return;
    if (entry.isIntersecting) { if (video.paused) video.play().catch(e => console.log('Autoplay prevented', e)); } 
    else { if (!video.paused) video.pause(); }
  });
}, { threshold: 0.6 });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(r => console.log('SW registered')).catch(e => console.log('SW error', e));
  });
}

document.getElementById('sidebar-trigger')?.addEventListener('click', () => document.getElementById('sidebar-drawer').classList.remove('hidden'));
document.getElementById('close-sidebar')?.addEventListener('click', () => document.getElementById('sidebar-drawer').classList.add('hidden'));
document.getElementById('sidebar-drawer')?.addEventListener('click', (e) => { if (e.target.id === 'sidebar-drawer') e.target.classList.add('hidden'); });

const desktopPostInput = document.querySelector('.create-post-pill .post-input-btn');
if (desktopPostInput) desktopPostInput.addEventListener('click', (e) => e.target.closest('.create-post-pill').classList.toggle('expanded'));

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-target]');
  if (trigger && !e.target.closest('.open-chat-btn')) {
    e.preventDefault();
    const targetId = trigger.getAttribute('data-target');
    const modal = document.getElementById(targetId + '-modal');
    if (modal) {
        document.querySelectorAll('.slide-modal.active').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
    }
  }
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    e.preventDefault();
    const modal = document.getElementById(closeBtn.getAttribute('data-close'));
    if (modal) modal.classList.remove('active');
  }
});

setLanguage('en');
setView('feed');

window.renderStage = renderStage;
window.renderJobs = renderJobs;
window.renderNetworkBoard = renderNetworkBoard;
window.setView = setView;
