import { StorageServiceInstance as StorageService, setLanguage } from './js/components/core.js';
import { getCurrentUser, getCreatorProfile, logout } from './js/auth.js';
import { renderStage } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList, initChatModule } from './js/components/chat.js';
import { renderNotifications } from './js/components/notifications.js';
import { initSearch } from './js/components/search.js';
import { initSettings } from './js/components/settings.js';
import { initToast } from './js/components/toast.js';

window.StorageService = StorageService;
window.logout = logout;

// Consolidated View Management
export function setView(name) {
    console.log('[KALAKAR] Switching view to:', name);
    const views = {
        'feed': document.querySelector('#feed-view'),
        'jobs': document.querySelector('#jobs-view'),
        'network': document.querySelector('#network-view'),
        'projects': document.querySelector('#projects-view'),
        'messages': document.querySelector('#messages-view'),
        'notifications': document.querySelector('#notifications-view')
    };

    // Hide all views safely
    Object.values(views).forEach(v => {
        if (v) v.classList.add('hidden');
    });

    // Show active view
    const activeView = views[name];
    if (activeView) {
        activeView.classList.remove('hidden');
        routeToView(name);
    }
}

function routeToView(view) {
    console.log('[KALAKAR] Routing to view component:', view);
    try {
        if (view === 'feed') renderStage();
        if (view === 'network') renderNetworkBoard();
        if (view === 'jobs') renderJobs();
        if (view === 'messages') renderChatList();
        if (view === 'notifications') renderNotifications();
    } catch (e) {
        console.error('[KALAKAR] Error in routeToView for:', view, e);
    }
}

async function boot() {
    console.log('[KALAKAR] Booting application...');
    try {
        initToast();
        const splash = document.getElementById('splash-screen');
        
        // Final splash safety
        setTimeout(() => {
            if (splash && splash.style.display !== 'none') {
                splash.style.display = 'none';
                console.log('[KALAKAR] Splash hard-hide triggered');
            }
        }, 5000);

        const user = await getCurrentUser().catch(() => null);
        console.log('[KALAKAR] User found:', user?.$id);

        if (splash) splash.style.display = 'none';

        if (!user) {
            showAuthScreen();
            return;
        }

        const profile = await getCreatorProfile(user.$id).catch(() => null);
        console.log('[KALAKAR] Profile found:', profile?.$id);
        
        if (!profile) {
            showOnboardingWizard();
            return;
        }

        StorageService.set(StorageService.KEYS.USER, user.$id);
        StorageService.set('kalakar_user_profile', profile);
        initMainApp();
    } catch (e) {
        console.error('[KALAKAR] Boot crash:', e);
        document.getElementById('splash-screen').style.display = 'none';
    }
}

function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-shell').style.display = 'none';
    import('./js/views/login.js').then(m => m.initLoginView()).catch(console.error);
}

function showOnboardingWizard() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('onboarding-wizard').classList.remove('hidden');
    import('./js/views/onboarding.js').then(m => m.initOnboardingView()).catch(console.error);
}

async function initMainApp() {
    console.log('[KALAKAR] Main App Initialization Started...');
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    
    // Non-blocking module init
    try { initChatModule(); } catch(e) {}
    try { initSearch(); } catch(e) {}
    try { initSettings(); } catch(e) {}
    
    setupNavigation();
    
    const requestedView = window.location.hash.replace('#', '') || 'feed';
    setView(requestedView);
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-item, .nav-links a, .mobile-nav a, [data-target]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            let target = link.dataset.target || (link.getAttribute('href') || '').substring(1);
            
            // Text-based fallback for robust mapping
            if (!target || target === '') {
                const text = link.querySelector('span')?.textContent.trim().toLowerCase();
                const textMap = { 'home': 'feed', 'feed': 'feed', 'network': 'network', 'jobs': 'jobs', 'messaging': 'messages', 'notifications': 'notifications' };
                target = textMap[text] || target;
            }

            const validViews = ['feed', 'network', 'jobs', 'messages', 'notifications', 'projects', 'saved', 'settings'];
            
            if (validViews.includes(target)) {
                e.preventDefault();
                console.log('[KALAKAR] Navigating to:', target);
                window.location.hash = target;
                setView(target);
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
}

// Global Intersections for Video Autoplay
window.kalakarVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (video.tagName === 'VIDEO') {
            if (entry.isIntersecting) video.play().catch(() => {});
            else video.pause();
        }
    });
}, { threshold: 0.6 });

// Direct Invoke
boot();
