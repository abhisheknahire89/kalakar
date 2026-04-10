import { loginWithGoogle, sendMagicLink } from '../auth.js';

function setStatus(message = '', type = 'default') {
  const status = document.getElementById('auth-status');
  if (!status) return;
  status.textContent = message;
  status.style.color = type === 'danger'
    ? '#ff8b8b'
    : type === 'success'
      ? 'var(--brand-gold)'
      : 'var(--muted)';
}

function setButtonState(button, loading, idleLabel, loadingLabel) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? loadingLabel : idleLabel;
}

export function initLoginView() {
  const form = document.getElementById('magic-link-form');
  const emailInput = document.getElementById('magic-link-email');
  const sendButton = document.getElementById('send-magic-link-btn');
  const sentState = document.getElementById('magic-link-sent-state');
  const emailDisplay = document.getElementById('magic-link-email-display');
  const changeEmailButton = document.getElementById('change-email-btn');
  const googleButton = document.getElementById('google-btn');
  const params = new URLSearchParams(window.location.search);

  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';

  if (params.get('authError') === 'google') {
    setStatus('Google sign-in did not complete. Please try again.', 'danger');
  } else if (params.get('authError') === 'magic-link') {
    setStatus('Magic link expired or was already used. Request a fresh one.', 'danger');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    setButtonState(sendButton, true, 'Email me a magic link', 'Sending link...');

    const result = await sendMagicLink(emailInput?.value || '');
    setButtonState(sendButton, false, 'Email me a magic link', 'Sending link...');

    if (!result.success) {
      setStatus(result.error?.message || 'Unable to send magic link right now.', 'danger');
      return;
    }

    form.classList.add('hidden');
    sentState?.classList.remove('hidden');
    if (emailDisplay) emailDisplay.textContent = result.data?.email || emailInput?.value || '';
    setStatus('Secure sign-in link sent. Open it on this device to continue.', 'success');
  });

  changeEmailButton?.addEventListener('click', () => {
    form.classList.remove('hidden');
    sentState?.classList.add('hidden');
    setStatus('');
    emailInput?.focus();
  });

  googleButton?.addEventListener('click', async () => {
    setStatus('');
    setButtonState(googleButton, true, 'Continue with Google', 'Redirecting...');
    const result = await loginWithGoogle();

    if (!result.success) {
      setButtonState(googleButton, false, 'Continue with Google', 'Redirecting...');
      setStatus(result.error?.message || 'Google sign-in failed.', 'danger');
    }
  });
}
