import { StorageServiceInstance as StorageService, setLanguage, setView } from './js/components/core.js';
import { getCurrentUser, getCreatorProfile, logout } from './js/auth.js';
import { renderStage } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList, initChatModule } from './js/components/chat.js';
import { renderNotifications, updateNotificationBadge } from './js/components/notifications.js';
import { initSearch } from './js/components/search.js';
import { initSettings } from './js/components/settings.js';
import { initToast } from './js/components/toast.js';

window.StorageService = StorageService;

async function boot() {
    initToast();

    // 1. Splash Screen
    const loadingPhrases = ["Setting the Stage...", "Rolling Camera...", "Finding your Crew..."];
    let phraseIndex = 0;
    const phraseEl = document.getElementById('loading-phrase');
    const phraseInterval = setInterval(() => {
        phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
        if (phraseEl) phraseEl.textContent = loadingPhrases[phraseIndex];
    }, 500);

    // 2. Auth Check
    const user = await getCurrentUser();
    
    setTimeout(async () => {
        clearInterval(phraseInterval);
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';

        if (!user) {
            // Not logged in -> Show Login View
            showAuthScreen();
            return;
        }

        // 3. Profile Check
        const profile = await getCreatorProfile(user.$id);
        if (!profile) {
            // Logged in but no profile -> Show Onboarding View
            showOnboardingWizard();
            return;
        }

        // 4. Authenticated & Onboarded -> Load App
        StorageService.set(StorageService.KEYS.USER, user.$id);
        StorageService.set('kalakar_user_profile', profile);
        
        initMainApp();
    }, 1500);
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
    // Initialize Login Controller logic
    import('./js/views/login.js').then(m => m.initLoginView());
}

function showOnboardingWizard() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('onboarding-wizard').classList.remove('hidden');
    // Initialize Onboarding Controller logic
    import('./js/views/onboarding.js').then(m => m.initOnboardingView());
}

async function initMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'block';
    
    // Core Modules
    initChatModule();
    initSearch();
    initSettings();
    
    // Phase 8: Real-time Listeners
    const { setupNotificationListener, updateNotificationBadge } = await import('./js/components/notifications.js');
    setupNotificationListener();
    updateNotificationBadge();
    
    setupNavigation();
    
    // Default View
    const requestedView = window.location.hash.replace('#', '') || 'feed';
    setView(requestedView);
    routeToView(requestedView);
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item, .nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const link = e.target.closest('a') || e.target.closest('.nav-item');
            if (!link) return;
            
            const text = link.querySelector('span')?.textContent.toLowerCase();
            const viewMap = { 'feed': 'feed', 'network': 'network', 'jobs': 'jobs', 'messaging': 'messages', 'notifications': 'notifications' };
            const targetView = viewMap[text];

            if (targetView) {
                e.preventDefault();
                setView(targetView);
                routeToView(targetView);
                navItems.forEach(ni => ni.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

function routeToView(view) {
    if (view === 'feed') renderStage();
    if (view === 'network') renderNetworkBoard();
    if (view === 'jobs') renderJobs();
    if (view === 'messages') renderChatList();
    if (view === 'notifications') renderNotifications();
}

// Global Intersections for Video Autoplay
window.kalakarVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (!video || video.tagName !== 'VIDEO') return;
        if (entry.isIntersecting) {
            if (video.paused) video.play().catch(() => {});
        } else {
            if (!video.paused) video.pause();
        }
    });
}, { threshold: 0.6 });

// Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

document.addEventListener('DOMContentLoaded', boot);
window.logout = logout;
