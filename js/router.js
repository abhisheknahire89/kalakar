const DEFAULT_VIEW = 'stage';
let routeHandler = null;
const NAV_SELECTOR = '[data-nav], .mobile-nav a[href^="#"], .nav-links a[href^="#"], .bottom-nav .nav-item';

function normalizeViewName(value) {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().replace(/^#/, '').toLowerCase();
  if (normalized === 'home' || normalized === 'feed') return 'stage';
  return normalized;
}

function collectViewMap() {
  const map = new Map();

  const semanticViews = document.querySelectorAll('section[data-view], main[data-view], article[data-view], div[data-view]');
  semanticViews.forEach((el) => {
    const key = normalizeViewName(el.getAttribute('data-view'));
    if (key && !map.has(key)) map.set(key, el);
  });

  const legacyViews = document.querySelectorAll('.view[id$="-view"], [data-route-view]');
  legacyViews.forEach((el) => {
    const explicit = normalizeViewName(el.getAttribute('data-route-view'));
    const fromId = normalizeViewName((el.id || '').replace(/-view$/, ''));
    const key = explicit || fromId;
    if (key && !map.has(key)) map.set(key, el);
  });

  return map;
}

function collectDefaultView(viewMap) {
  if (viewMap.has(DEFAULT_VIEW)) return DEFAULT_VIEW;
  const first = viewMap.keys().next();
  return first.done ? '' : first.value;
}

function setHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle('hidden', hidden);
  el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
}

function resolveNavTarget(el) {
  if (!el) return '';

  const direct = normalizeViewName(el.dataset.nav || el.dataset.view);
  if (direct) return direct;

  const href = el.getAttribute('href') || '';
  if (href.startsWith('#')) return normalizeViewName(href);

  return '';
}

function updateActiveNav(viewName) {
  const navItems = document.querySelectorAll(NAV_SELECTOR);
  navItems.forEach((item) => {
    const target = resolveNavTarget(item);
    item.classList.toggle('active', Boolean(target) && target === viewName);
  });
}

function notifyMissingView(requestedView, fallbackView) {
  const message = `View "${requestedView}" not found. Redirected to "${fallbackView}".`;
  if (typeof window.showToast === 'function') {
    window.showToast(message, 'info');
    return;
  }
  console.warn(message);
}

export function setRouteHandler(handler) {
  routeHandler = typeof handler === 'function' ? handler : null;
}

function verifyNavigationTargets(viewMap) {
  const navItems = document.querySelectorAll(NAV_SELECTOR);
  navItems.forEach((item) => {
    const target = resolveNavTarget(item);
    if (!target) return;
    if (!viewMap.has(target)) {
      console.warn(`Router: navigation target "${target}" has no matching [data-view] section.`);
    }
  });
}

export function navigateTo(viewName, options = {}) {
  const { updateHash = true, silent = false } = options;
  const requestedView = normalizeViewName(viewName);
  const viewMap = collectViewMap();
  const fallbackView = collectDefaultView(viewMap);

  if (!fallbackView) {
    console.warn('Router: no views available to render.');
    return false;
  }

  const finalView = viewMap.has(requestedView) ? requestedView : fallbackView;
  if (!viewMap.has(requestedView) && requestedView && !silent) {
    notifyMissingView(requestedView, fallbackView);
  }

  viewMap.forEach((el, key) => setHidden(el, key !== finalView));
  updateActiveNav(finalView);

  if (updateHash) {
    const nextHash = `#${finalView}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }

  if (routeHandler) {
    try {
      routeHandler(finalView);
    } catch (error) {
      console.warn('Router route handler fallback used.');
    }
  }

  return true;
}

function bindNavEvents() {
  const navItems = document.querySelectorAll(NAV_SELECTOR);
  navItems.forEach((item) => {
    if (item.dataset.routerBound === '1') return;
    item.dataset.routerBound = '1';

    item.addEventListener('click', (event) => {
      const target = resolveNavTarget(item);
      if (!target) return;
      event.preventDefault();
      navigateTo(target);
    });

    if (item.tagName !== 'A' && item.tagName !== 'BUTTON') {
      item.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const target = resolveNavTarget(item);
        if (!target) return;
        event.preventDefault();
        navigateTo(target);
      });
    }
  });
}

export function initRouter(options = {}) {
  const { defaultView = DEFAULT_VIEW } = options;
  const viewMap = collectViewMap();
  const startView = normalizeViewName(window.location.hash) || normalizeViewName(defaultView) || DEFAULT_VIEW;

  verifyNavigationTargets(viewMap);
  bindNavEvents();
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash, { updateHash: false, silent: true });
  });

  navigateTo(startView, { updateHash: true, silent: true });
}
