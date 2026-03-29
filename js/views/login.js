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
        const phone = document.getElementById('country-code').value + phoneInput.value;
        if (phoneInput.value.length < 10) {
            window.showToast('Please enter a 10-digit number', 'info');
            return;
        }

        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = 'Sending...';

        const result = await sendPhoneOTP(phone);
        if (result.success) {
            otpUserId = result.userId;
            document.getElementById('phone-form').classList.add('hidden');
            document.getElementById('otp-form').classList.remove('hidden');
            document.getElementById('otp-phone-display').textContent = phone;
            otpDigits[0].focus();
        } else {
            window.showToast(result.error, 'danger');
        }
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
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

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.textContent = 'Verifying...';

        const result = await verifyPhoneOTP(otpUserId, otp);
        if (result.success) {
            window.location.reload(); // Boot sequence will handle routing
        } else {
            window.showToast(result.error, 'danger');
            otpDigits.forEach(d => d.value = '');
            otpDigits[0].focus();
        }
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify';
    }

    verifyOtpBtn?.addEventListener('click', handleVerify);

    // 4. Change Number
    changeNumberBtn?.addEventListener('click', () => {
        document.getElementById('phone-form').classList.remove('hidden');
        document.getElementById('otp-form').classList.add('hidden');
    });

    // 5. Google OAuth
    googleBtn?.addEventListener('click', () => {
        loginWithGoogle();
    });
}
