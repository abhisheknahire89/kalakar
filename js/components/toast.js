let container = null;

function ensureContainer() {
  if (container) return container;

  container = document.createElement('div');
  container.id = 'toast-container';
  container.style.position = 'fixed';
  container.style.left = '50%';
  container.style.bottom = 'calc(88px + env(safe-area-inset-bottom))';
  container.style.transform = 'translateX(-50%)';
  container.style.zIndex = '9999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '10px';
  container.style.width = 'min(92vw, 420px)';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);
  return container;
}

export function showToast(message, type = 'info') {
  if (!message) return;
  const root = ensureContainer();
  const toast = document.createElement('div');
  const palette = {
    info: { bg: 'rgba(20,20,20,0.96)', border: 'rgba(255,255,255,0.08)', fg: 'var(--text)' },
    success: { bg: 'rgba(212,175,55,0.96)', border: 'rgba(212,175,55,0.35)', fg: '#111' },
    danger: { bg: 'rgba(161,49,49,0.96)', border: 'rgba(255,122,122,0.35)', fg: '#fff' }
  };
  const styles = palette[type] || palette.info;

  toast.style.pointerEvents = 'auto';
  toast.style.padding = '14px 16px';
  toast.style.borderRadius = '18px';
  toast.style.border = `1px solid ${styles.border}`;
  toast.style.background = styles.bg;
  toast.style.backdropFilter = 'blur(16px)';
  toast.style.color = styles.fg;
  toast.style.boxShadow = '0 20px 60px rgba(0,0,0,0.28)';
  toast.style.fontSize = '0.92rem';
  toast.style.fontWeight = '600';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(10px)';
  toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
  toast.textContent = message;

  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

export function initToast() {
  ensureContainer();
  window.showToast = showToast;
}
