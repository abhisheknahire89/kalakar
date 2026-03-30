import { sendPhoneOTP, verifyPhoneOTP, loginWithGoogle } from '../auth.js';

let otpUserId = null;

export function initLoginView() {
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const googleBtn = document.getElementById('google-btn');
    const changeNumberBtn = document.getElementById('change-number-btn');
    const phoneInput = document.getElementById('phone-input');
    const otpDigits = document.querySelectorAll('.otp-digit');

    // 1. Phone OTP Step
    sendOtpBtn?.addEventListener('click', async () => {
        const countryCode = document.getElementById('country-code');
        const phone = String(countryCode?.value || '+91') + String(phoneInput?.value || '');
        if (String(phoneInput?.value || '').length < 10) {
            notify('Please enter a 10-digit number', 'info');
            return;
        }

        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';

        try {
            const result = await sendPhoneOTP(phone);
            if (result.success) {
                otpUserId = result?.data?.userId || result.userId || null;
                if (!otpUserId) {
                    notify('Failed to initialize OTP session. Please try again.', 'danger');
                    return;
                }
                document.getElementById('phone-form')?.classList.add('hidden');
                document.getElementById('otp-form')?.classList.remove('hidden');
                const phoneDisplay = document.getElementById('otp-phone-display');
                if (phoneDisplay) phoneDisplay.textContent = phone;
                if (otpDigits[0]) otpDigits[0].focus();
            } else {
                notify(result.error || 'Unable to send OTP.', 'danger');
            }
        } catch (_) {
            notify('Unable to send OTP right now.', 'danger');
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
        }
    });

    // 2. OTP Digits Logic
    otpDigits.forEach((digit, index) => {
        digit.addEventListener('input', (e) => {
            if (e.target.value && index < 5) {
                otpDigits[index + 1].focus();
            }
            if (Array.from(otpDigits).every(d => d.value.length === 1)) {
                handleVerify();
            }
        });

        digit.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !digit.value && index > 0) {
                otpDigits[index - 1].focus();
            }
        });
    });

    // 3. Verify Step
    async function handleVerify() {
        const otp = Array.from(otpDigits).map(d => d.value).join('');
        if (otp.length < 6) return;
        if (!otpUserId) {
            notify('OTP session not found. Please request OTP again.', 'danger');
            document.getElementById('phone-form')?.classList.remove('hidden');
            document.getElementById('otp-form')?.classList.add('hidden');
            return;
        }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';

        try {
            const result = await verifyPhoneOTP(otpUserId, otp);
            if (result.success) {
                window.location.reload();
            } else {
                notify(result.error || 'OTP verification failed.', 'danger');
                otpDigits.forEach(d => d.value = '');
                if (otpDigits[0]) otpDigits[0].focus();
            }
        } catch (_) {
            notify('OTP verification failed. Please retry.', 'danger');
            otpDigits.forEach(d => d.value = '');
            if (otpDigits[0]) otpDigits[0].focus();
        }
        finally {
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify';
        }
    }

    verifyOtpBtn?.addEventListener('click', handleVerify);

    // 4. Change Number
    changeNumberBtn?.addEventListener('click', () => {
        document.getElementById('phone-form')?.classList.remove('hidden');
        document.getElementById('otp-form')?.classList.add('hidden');
        otpDigits.forEach(d => d.value = '');
        otpUserId = null;
    });

    // 5. Google OAuth
    googleBtn?.addEventListener('click', async () => {
        googleBtn.disabled = true;
        googleBtn.textContent = 'Redirecting...';
        try {
            const result = await loginWithGoogle();
            if (!result.success) {
                notify(result.error || 'Google login failed.', 'danger');
            }
        } catch (_) {
            notify('Google login failed.', 'danger');
        } finally {
            googleBtn.disabled = false;
            googleBtn.textContent = 'Continue with Google';
        }
    });
}

function notify(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }

    console[type === 'danger' ? 'error' : 'log'](message);
}
