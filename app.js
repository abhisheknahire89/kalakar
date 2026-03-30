import { StorageServiceInstance as StorageService, setLanguage } from './js/components/core.js';
import { getCurrentUser, getCreatorProfile, logout } from './js/auth.js';
import { renderStage } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList, initChatModule } from './js/components/chat.js';
import { renderNotifications } from './js/components/notifications.js';
import { renderProfile } from './js/components/profile.js';
import { initSearch } from './js/components/search.js';
import { initSettings } from './js/components/settings.js';
import { initToast } from './js/components/toast.js';
import { initRouter, navigateTo, setRouteHandler } from './js/router.js';

window.StorageService = StorageService;
window.logout = logout;
window.setView = setView;

function unwrapResult(result) {
    if (result && typeof result === 'object' && 'success' in result) {
        return result.success ? (result.data ?? null) : null;
    }

    return result ?? null;
}

// Consolidated View Management
export function setView(name) {
    console.log('[KALAKAR] Switching view to:', name);
    navigateTo(name);
}

function routeToView(view) {
    console.log('[KALAKAR] Routing to view component:', view);
    try {
        if (view === 'feed') renderStage();
        if (view === 'network') renderNetworkBoard();
        if (view === 'jobs') renderJobs();
        if (view === 'messages') renderChatList();
        if (view === 'notifications') renderNotifications();
        if (view === 'profile') renderProfile();
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

        const user = unwrapResult(await getCurrentUser().catch(() => null));
        console.log('[KALAKAR] User found:', user?.$id);

        if (splash) splash.style.display = 'none';

        if (!user) {
            showAuthScreen();
            return;
        }

        const profile = unwrapResult(await getCreatorProfile(user.$id).catch(() => null));
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
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
    }
}

function showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    const onboardingWizard = document.getElementById('onboarding-wizard');

    if (authScreen) authScreen.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
    if (onboardingWizard) onboardingWizard.classList.add('hidden');
    import('./js/views/login.js').then(m => m.initLoginView()).catch(console.error);
}

function showOnboardingWizard() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    const onboardingWizard = document.getElementById('onboarding-wizard');

    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'none';
    if (onboardingWizard) onboardingWizard.classList.remove('hidden');
    import('./js/views/onboarding.js').then(m => m.initOnboardingView()).catch(console.error);
}

async function initMainApp() {
    console.log('[KALAKAR] Main App Initialization Started...');
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    const onboardingWizard = document.getElementById('onboarding-wizard');

    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';
    if (onboardingWizard) onboardingWizard.classList.add('hidden');
    
    // Non-blocking module init
    try { initChatModule(); } catch(e) {}
    try { initSearch(); } catch(e) {}
    try { initSettings(); } catch(e) {}
    setupDeadButtonFallbacks();
    
    setRouteHandler(routeToView);
    initRouter({ defaultView: 'feed' });
}

function setupDeadButtonFallbacks() {
    const quickActions = [
        document.getElementById('nav-post-fab'),
        document.getElementById('mobile-post-btn'),
        document.getElementById('post-job-trigger')
    ];

    quickActions.forEach((action) => {
        if (!action || action.dataset.boundFallback === '1') return;
        action.dataset.boundFallback = '1';

        action.addEventListener('click', (event) => {
            event.preventDefault();
            const modal = document.getElementById('post-job-modal');
            if (modal) {
                modal.classList.remove('hidden');
                return;
            }

            if (typeof window.showToast === 'function') {
                window.showToast('Create post coming soon.', 'info');
            }
        });
    });

    const postModal = document.getElementById('post-job-modal');
    const closeButton = postModal?.querySelector('.close-btn');
    if (closeButton && closeButton.dataset.boundFallback !== '1') {
        closeButton.dataset.boundFallback = '1';
        closeButton.addEventListener('click', () => {
            postModal.classList.add('hidden');
        });
    }
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
