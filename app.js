import { StorageServiceInstance as StorageService, setLanguage, setView } from './js/components/core.js';
import { renderStage, renderTrendingWidget } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList, initChatModule } from './js/components/chat.js';
import { renderNotifications, updateNotificationBadge } from './js/components/notifications.js';
import { initSearch } from './js/components/search.js';
import { initSettings } from './js/components/settings.js';
import { initToast } from './js/components/toast.js';

window.StorageService = StorageService;

// Appwrite Migration: Polyfill global appwriteClient if needed, but we use imports.
// We'll replace the old supabase check with a simple auto-login for now (Prompt 8 goal is functional UI)
const MOCK_USER = { id: 'u1', name: 'Ishaan Verma', role: 'Actor' };
if (!StorageService.get(StorageService.KEYS.USER)) {
  StorageService.set(StorageService.KEYS.USER, MOCK_USER.id);
  StorageService.set('kalakar_user_profile', MOCK_USER);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Global Modules
    initToast();
    initChatModule();
    initSearch();
    initSettings();
    updateNotificationBadge();

    // 2. Splash Screen Logic
    const loadingPhrases = ["Setting the Stage...", "Rolling Camera...", "Finding your Crew..."];
    let phraseIndex = 0;
    const phraseEl = document.getElementById('loading-phrase');
    const phraseInterval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
        if (phraseEl) phraseEl.textContent = loadingPhrases[phraseIndex];
    }, 500);

    setTimeout(() => {
        clearInterval(phraseInterval);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
        
        // Navigation Logic
        setupNavigation();
        
        // Initial View
        setView('feed');
        renderStage();
    }, 1500);
});

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const link = e.target.closest('a') || e.target.closest('.nav-item');
            if (!link) return;
            
            const text = link.querySelector('span')?.textContent.toLowerCase();
            if (!text) return;

            // Handle View Switching
            const viewMap = {
                'home': 'feed',
                'network': 'network',
                'jobs': 'jobs',
                'messaging': 'messages',
                'notifications': 'notifications'
            };

            const targetView = viewMap[text];
            if (targetView) {
                e.preventDefault();
                setView(targetView);
                
                // Trigger Renderers
                if (targetView === 'feed') renderStage();
                if (targetView === 'network') renderNetworkBoard();
                if (targetView === 'jobs') renderJobs();
                if (targetView === 'messages') {
                    renderChatList();
                }
                if (targetView === 'notifications') renderNotifications();
                
                // Active Class Management
                navItems.forEach(ni => ni.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Sidebar trigger
    document.getElementById('sidebar-trigger')?.addEventListener('click', () => {
        document.getElementById('sidebar-drawer').classList.remove('hidden');
    });
    
    document.getElementById('close-sidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar-drawer').classList.add('hidden');
    });

    // Search trigger
    document.getElementById('search-trigger')?.addEventListener('click', () => {
        document.getElementById('search-overlay').classList.remove('hidden');
    });
    
    document.getElementById('close-search')?.addEventListener('click', () => {
        document.getElementById('search-overlay').classList.add('hidden');
    });
}

// Global Intersections for Video Autoplay
window.kalakarVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (!video || video.tagName !== 'VIDEO') return;
        if (entry.isIntersecting) {
            if (video.paused) video.play().catch(e => console.log('Autoplay prevented', e));
        } else {
            if (!video.paused) video.pause();
        }
    });
}, { threshold: 0.6 });

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(r => console.log('SW registered')).catch(e => console.log('SW error', e));
    });
}

// Export for global access if needed
window.renderStage = renderStage;
window.renderJobs = renderJobs;
window.renderNetworkBoard = renderNetworkBoard;
window.setView = setView;
