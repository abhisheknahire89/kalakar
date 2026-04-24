import { StorageServiceInstance as StorageService, setLanguage } from './js/components/core.js';
import { getCurrentUser, getCreatorProfile, logout } from './js/auth.js';
import { renderStage } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { initChatModule } from './js/components/chat.js';
import { renderMessagesView } from './js/components/messages.js';
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
        if (view === 'stage' || view === 'feed') renderStage();
        if (view === 'network') renderNetworkBoard();
        if (view === 'jobs') renderJobs();
        if (view === 'messages') renderMessagesView();
        if (view === 'notifications') renderNotifications();
        if (view === 'profile') renderProfile();
        if (view === 'search') {
            const searchInput = document.getElementById('search-view-input');
            if (searchInput) searchInput.focus();
        }
        ensureViewNotBlank(view);
    } catch (e) {
        console.warn('[KALAKAR] Route render fallback for:', view);
        ensureViewNotBlank(view);
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
        console.warn('[KALAKAR] Boot fallback activated');
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.display = 'none';
        showAuthScreen();
    }
}

function showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    const onboardingWizard = document.getElementById('onboarding-wizard');

    if (authScreen) authScreen.style.display = 'flex';
    if (appShell) appShell.style.display = 'none';
    if (onboardingWizard) onboardingWizard.classList.add('hidden');
    import('./js/views/login.js').then(m => m.initLoginView()).catch(() => {
        console.warn('[KALAKAR] Login module unavailable, showing fallback.');
    });
}

function showOnboardingWizard() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell') || document.querySelector('.app-shell');
    const onboardingWizard = document.getElementById('onboarding-wizard');

    if (authScreen) authScreen.style.display = 'none';
    if (appShell) appShell.style.display = 'none';
    if (onboardingWizard) onboardingWizard.classList.remove('hidden');
    import('./js/views/onboarding.js').then(m => m.initOnboardingView()).catch(() => {
        console.warn('[KALAKAR] Onboarding module unavailable, showing fallback.');
    });
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
    disableUnimplementedActions();
    
    setRouteHandler(routeToView);
    initRouter({ defaultView: 'stage' });
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

function disableUnimplementedActions() {
    const selectors = ['[data-coming-soon="1"]', '#initiate-deal-btn', '#tp-vouch-btn'];

    selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
            if (!el || el.dataset.disabledByApp === '1') return;
            el.dataset.disabledByApp = '1';
            el.setAttribute('aria-disabled', 'true');
            el.setAttribute('title', 'Coming soon');
            if (el.tagName === 'BUTTON') el.disabled = true;
            el.style.pointerEvents = 'none';
            el.style.opacity = '0.6';

            const label = (el.textContent || '').trim();
            if (label && !/coming soon/i.test(label)) {
                el.textContent = `${label} (Coming soon)`;
            } else if (!label) {
                el.textContent = 'Coming soon';
            }
        });
    });
}

function ensureViewNotBlank(view) {
    const viewEl = document.querySelector(`[data-view="${view}"]`);
    if (!viewEl) return;

    const hasVisibleCard = viewEl.querySelector('.card, .panel, .post-card, .job-card, .chat-item, .notification-card, .empty-state, .screen-loading');
    if (hasVisibleCard) return;

    const existingPlaceholder = viewEl.querySelector('[data-coming-soon-placeholder="1"]');
    if (existingPlaceholder) return;

    const placeholder = document.createElement('article');
    placeholder.className = 'card';
    placeholder.dataset.comingSoonPlaceholder = '1';
    placeholder.innerHTML = `
      <h3>Coming soon</h3>
      <p class="meta">This section is being prepared for the pilot demo.</p>
    `;
    viewEl.appendChild(placeholder);
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
