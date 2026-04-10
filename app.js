import { StorageServiceInstance as StorageService } from './js/components/core.js';
import { getCurrentUser, getCreatorProfile, logout, consumeMagicLinkSession } from './js/auth.js';
import { renderStage } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderChatList, initChatModule } from './js/components/chat.js';
import { renderNotifications, updateNotificationBadge } from './js/components/notifications.js';
import { renderProfile } from './js/components/profile.js';
import { openPostComposer } from './js/components/postComposer.js';
import { initToast, showToast } from './js/components/toast.js';
import { initRouter, navigateTo, setRouteHandler } from './js/router.js';
import { getFilePreviewUrl, BUCKETS } from './js/appwriteClient.js';

const ROUTE_RENDERERS = {
  feed: () => renderStage(),
  explore: () => renderNetworkBoard(),
  'deal-room': () => renderChatList(),
  notifications: () => renderNotifications(),
  profile: () => renderProfile()
};

let shellBound = false;

window.logout = logout;
window.setView = navigateTo;

function toggleVisibility(element, visible, displayValue = 'block') {
  if (!element) return;
  element.classList.toggle('hidden', !visible);
  element.style.display = visible ? displayValue : 'none';
}

function hydrateShell(profile) {
  StorageService.set(StorageService.KEYS.USER, profile.userId || profile.$id);
  StorageService.set('kalakar_user_profile', profile);

  document.querySelectorAll('.profile-name, .sidebar-user-info h3').forEach((node) => {
    node.textContent = profile.name || 'Kalakar Creator';
  });
  document.querySelectorAll('.profile-headline, .sidebar-user-info p, .me-label').forEach((node) => {
    if (node.classList.contains('me-label')) {
      node.textContent = 'Profile';
      return;
    }
    node.textContent = `${profile.primaryCraft || profile.role || 'Creator'} · ${profile.city || 'India'}`;
  });
  document.querySelectorAll('.profile-avatar-main, .user-avatar, .user-avatar-large').forEach((image) => {
    image.src = profile.avatarFileId
      ? getFilePreviewUrl(BUCKETS.AVATARS || BUCKETS.avatars, profile.avatarFileId)
      : `https://i.pravatar.cc/200?u=${encodeURIComponent(profile.$id || profile.userId || 'kalakar')}`;
  });
}

function bindShellActions() {
  if (shellBound) return;
  shellBound = true;

  const openComposer = (event) => {
    event?.preventDefault?.();
    openPostComposer();
  };

  ['nav-post-fab', 'mobile-post-btn', 'open-upload-btn-mobile', 'feed-compose-card', 'feed-compose-inline'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', openComposer);
  });

  document.getElementById('msg-trigger')?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('deal-room');
  });

  document.getElementById('mobile-msg-trigger')?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('deal-room');
  });

  document.getElementById('sidebar-trigger')?.addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('profile');
  });

  document.getElementById('close-sidebar')?.addEventListener('click', () => {
    document.getElementById('sidebar-drawer')?.classList.add('hidden');
  });

  document.querySelector('#settings-modal .demo-list-item:last-child')?.addEventListener('click', async () => {
    await logout();
    window.location.hash = '';
    window.location.reload();
  });
}

async function renderRoute(viewName) {
  const renderer = ROUTE_RENDERERS[viewName] || ROUTE_RENDERERS.feed;
  await renderer();
}

async function initMainApp(profile) {
  const authScreen = document.getElementById('auth-screen');
  const onboardingWizard = document.getElementById('onboarding-wizard');
  const appShell = document.getElementById('app-shell');

  toggleVisibility(authScreen, false, 'flex');
  toggleVisibility(onboardingWizard, false, 'flex');
  toggleVisibility(appShell, true, 'grid');

  hydrateShell(profile);
  initChatModule();
  bindShellActions();
  setRouteHandler(renderRoute);
  initRouter({ defaultView: 'feed' });
  await updateNotificationBadge();
}

function showAuthScreen() {
  toggleVisibility(document.getElementById('auth-screen'), true, 'flex');
  toggleVisibility(document.getElementById('onboarding-wizard'), false, 'flex');
  toggleVisibility(document.getElementById('app-shell'), false, 'grid');
  import('./js/views/login.js').then((module) => module.initLoginView()).catch(() => {
    showToast('Login screen failed to load.', 'danger');
  });
}

function showOnboarding() {
  toggleVisibility(document.getElementById('auth-screen'), false, 'flex');
  toggleVisibility(document.getElementById('onboarding-wizard'), true, 'flex');
  toggleVisibility(document.getElementById('app-shell'), false, 'grid');
  import('./js/views/onboarding.js').then((module) => module.initOnboardingView()).catch(() => {
    showToast('Onboarding could not be loaded.', 'danger');
  });
}

async function boot() {
  initToast();
  const splash = document.getElementById('splash-screen');

  try {
    const magicLinkResult = await consumeMagicLinkSession();
    if (!magicLinkResult.success) {
      showToast(magicLinkResult.error?.message || 'Magic link sign-in failed.', 'danger');
    }

    const currentUser = await getCurrentUser();
    if (!currentUser.success) {
      showAuthScreen();
      return;
    }

    const profileResult = await getCreatorProfile(currentUser.data.$id);
    if (!profileResult.success) {
      showOnboarding();
      return;
    }

    await initMainApp(profileResult.data);
  } catch (error) {
    console.error('[KALAKAR] Boot error', error);
    showToast('The app could not finish loading. Refresh and try again.', 'danger');
    showAuthScreen();
  } finally {
    if (splash) splash.style.display = 'none';
  }
}

boot();
