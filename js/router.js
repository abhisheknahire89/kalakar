const DEFAULT_VIEW = 'feed';
const NAV_SELECTOR = '[data-nav], .mobile-nav a[href^="#"], .nav-links a[href^="#"], .bottom-nav .nav-item';

let routeHandler = null;
let aliases = {};
let hashListenerBound = false;

function normalizeViewName(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim().replace(/^#/, '').toLowerCase();
  return aliases[cleaned] || cleaned;
}

function collectViewMap() {
  const map = new Map();
  document.querySelectorAll('[data-view], [data-route-view], .view[id$="-view"]').forEach((el) => {
    const explicit = normalizeViewName(el.getAttribute('data-view') || el.getAttribute('data-route-view') || '');
    const fallback = normalizeViewName((el.id || '').replace(/-view$/, ''));
    const key = explicit || fallback;
    if (key && !map.has(key)) map.set(key, el);
  });
  return map;
}

function resolveTarget(el) {
  const fromDataset = normalizeViewName(el?.dataset?.nav || el?.dataset?.view || '');
  if (fromDataset) return fromDataset;
  const href = el?.getAttribute?.('href') || '';
  if (href.startsWith('#')) return normalizeViewName(href);
  return '';
}

function updateActiveNav(viewName) {
  document.querySelectorAll(NAV_SELECTOR).forEach((node) => {
    const target = resolveTarget(node);
    node.classList.toggle('active', Boolean(target) && target === viewName);
  });
}

export function setRouteHandler(handler) {
  routeHandler = typeof handler === 'function' ? handler : null;
}

export function navigateTo(viewName, options = {}) {
  const { updateHash = true } = options;
  const viewMap = collectViewMap();
  const requestedView = normalizeViewName(viewName || DEFAULT_VIEW);
  const fallback = viewMap.has(DEFAULT_VIEW) ? DEFAULT_VIEW : viewMap.keys().next().value;
  const nextView = viewMap.has(requestedView) ? requestedView : fallback;

  if (!nextView) return false;

  viewMap.forEach((element, key) => {
    const isActive = key === nextView;
    element.classList.toggle('hidden', !isActive);
    element.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  updateActiveNav(nextView);

  if (updateHash) {
    const hash = `#${nextView}`;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      return true;
    }
  }

  if (routeHandler) routeHandler(nextView);
  return true;
}

function bindNavEvents() {
  document.querySelectorAll(NAV_SELECTOR).forEach((node) => {
    if (node.dataset.routerBound === '1') return;
    node.dataset.routerBound = '1';

    const handler = (event) => {
      const target = resolveTarget(node);
      if (!target) return;
      event.preventDefault();
      navigateTo(target);
    };

    node.addEventListener('click', handler);

    if (node.tagName !== 'A' && node.tagName !== 'BUTTON') {
      node.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        handler(event);
      });
    }
  });
}

export function initRouter(options = {}) {
  aliases = {
    stage: 'feed',
    home: 'feed',
    network: 'explore',
    explore: 'explore',
    messages: 'deal-room',
    chat: 'deal-room',
    inbox: 'deal-room',
    ...options.aliases
  };

  bindNavEvents();

  if (!hashListenerBound) {
    hashListenerBound = true;
    window.addEventListener('hashchange', () => {
      navigateTo(window.location.hash, { updateHash: false });
    });
  }

  const initialView = normalizeViewName(window.location.hash) || normalizeViewName(options.defaultView || DEFAULT_VIEW);
  navigateTo(initialView, { updateHash: true });
}
