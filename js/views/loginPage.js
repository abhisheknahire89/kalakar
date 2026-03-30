import { sendPhoneOTP, verifyPhoneOTP, loginWithGoogle } from '../auth.js';

const phoneForm = document.getElementById('phone-form');
const otpForm = document.getElementById('otp-form');
const phoneInput = document.getElementById('phone-input');
const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const changePhoneBtn = document.getElementById('change-phone-btn');
const googleBtn = document.getElementById('google-btn');
const otpInputs = Array.from(document.querySelectorAll('.otp-input'));
const errorBox = document.getElementById('auth-error');
const successBox = document.getElementById('auth-success');

let otpUserId = '';

function clearMessages() {
  errorBox.textContent = '';
  successBox.textContent = '';
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function showSuccess(message) {
  successBox.textContent = message;
  successBox.classList.remove('hidden');
}

function getOtpValue() {
  return otpInputs.map((input) => input.value).join('');
}

function resetOtpInputs() {
  otpInputs.forEach((input) => {
    input.value = '';
  });
  otpInputs[0]?.focus();
}

function setupOtpInputs() {
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (event) => {
      const value = event.target.value.replace(/\D/g, '');
      event.target.value = value.slice(-1);

      if (value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace' && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (event) => {
      event.preventDefault();
      const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, otpInputs.length);
      pasted.split('').forEach((digit, digitIndex) => {
        if (otpInputs[digitIndex]) {
          otpInputs[digitIndex].value = digit;
        }
      });

      const focusIndex = Math.min(pasted.length, otpInputs.length - 1);
      otpInputs[focusIndex]?.focus();
    });
  });
}

phoneForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = 'Sending OTP...';

  const result = await sendPhoneOTP(phoneInput.value);

  sendOtpBtn.disabled = false;
  sendOtpBtn.textContent = 'Send OTP';

  if (!result.success) {
    showError(result.error || 'Unable to send OTP.');
    return;
  }

  otpUserId = result.data.userId;
  phoneForm.classList.add('hidden');
  otpForm.classList.remove('hidden');
  resetOtpInputs();
  showSuccess('OTP sent successfully.');
});

otpForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessages();

  const otp = getOtpValue();
  if (otp.length !== 6) {
    showError('Please enter the 6-digit OTP.');
    return;
  }

  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = 'Verifying...';

  const result = await verifyPhoneOTP(otpUserId, otp);

  verifyOtpBtn.disabled = false;
  verifyOtpBtn.textContent = 'Verify OTP';

  if (!result.success) {
    showError(result.error || 'OTP verification failed.');
    resetOtpInputs();
    return;
  }

  showSuccess('Login successful. Redirecting...');
  window.location.href = './onboarding.html';
});

changePhoneBtn?.addEventListener('click', () => {
  clearMessages();
  otpForm.classList.add('hidden');
  phoneForm.classList.remove('hidden');
  otpUserId = '';
});

googleBtn?.addEventListener('click', async () => {
  clearMessages();
  googleBtn.disabled = true;
  googleBtn.textContent = 'Redirecting...';

  const result = await loginWithGoogle();

  if (!result.success) {
    googleBtn.disabled = false;
    googleBtn.textContent = 'Continue with Google';
    showError(result.error || 'Google login failed.');
  }
});

setupOtpInputs();
