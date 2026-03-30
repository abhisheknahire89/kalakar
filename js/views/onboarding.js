import { createCreatorProfile } from '../auth.js';
import { storage, ID, BUCKETS } from '../appwriteClient.js';

let currentStep = 1;
const profileData = {
    primaryCraft: 'Actor',
    name: '',
    city: 'Mumbai',
    avatarFileId: '',
    accountType: 'talent',
    yearsExperience: 0,
    reelFileId: ''
};

export function initOnboardingView() {
    const nextBtns = document.querySelectorAll('.ob-next-btn');
    const prevBtns = document.querySelectorAll('.ob-prev-btn');
    const craftBtns = document.querySelectorAll('.craft-select');
    const accountCards = document.querySelectorAll('.account-select-card');
    const uploadBtn = document.getElementById('ob-complete-btn');
    const avatarInput = document.getElementById('ob-avatar-input');
    const reelInput = document.getElementById('ob-reel-input');
    const skipReelBtn = document.getElementById('ob-skip-reel');

    // 1. Craft Selection
    craftBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            craftBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            profileData.primaryCraft = btn.dataset.craft;
        });
    });

    // 2. Account Type Selection
    accountCards.forEach(card => {
        card.addEventListener('click', () => {
            accountCards.forEach(c => {
                c.classList.remove('active');
                c.style.borderColor = 'var(--line)';
                c.style.background = 'transparent';
            });
            card.classList.add('active');
            card.style.borderColor = 'var(--brand-gold)';
            card.style.background = 'rgba(197, 160, 89, 0.05)';
            profileData.accountType = card.dataset.type;
        });
    });

    // 3. Navigation
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep === 2) {
                profileData.name = document.getElementById('ob-name').value;
                profileData.city = document.getElementById('ob-city').value;
                if (!profileData.name) {
                    window.showToast('Please enter your name', 'info');
                    return;
                }
            }
            if (currentStep === 3) {
                profileData.yearsExperience = parseInt(document.getElementById('ob-exp').value);
            }
            goToStep(currentStep + 1);
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep - 1));
    });

    // 4. File Uploads (Avatar)
    avatarInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const preview = document.getElementById('ob-avatar-preview');
        preview.innerHTML = '<span class="spinner"></span>';

        try {
            const result = await storage.createFile(BUCKETS.avatars, ID.unique(), file);
            profileData.avatarFileId = result.$id;
            const url = storage.getFilePreview(BUCKETS.avatars, result.$id).href;
            preview.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
        } catch (error) {
            window.showToast('Failed to upload image', 'danger');
            preview.innerHTML = '📸';
        }
    });

    // 5. Reel Upload (Final Step)
    reelInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const dropZone = document.getElementById('ob-reel-drop');
        dropZone.innerHTML = '<p class="meta">Uploading Reel... <span id="reel-progress">0%</span></p>';

        try {
            const result = await storage.createFile(BUCKETS.avatars, ID.unique(), file);
            profileData.reelFileId = result.$id;
            dropZone.innerHTML = `<p class="meta" style="color:var(--success);">✅ Video Uploaded</p>`;
        } catch (error) {
            window.showToast('Reel upload failed', 'danger');
            dropZone.innerHTML = '<span style="font-size: 2rem;">📹</span><p class="meta">Upload Reel (Max 100MB)</p>';
        }
    });

    skipReelBtn?.addEventListener('click', () => {
        handleComplete();
    });

    uploadBtn?.addEventListener('click', () => {
        handleComplete();
    });
}

function goToStep(step) {
    document.querySelectorAll('.ob-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`ob-step-${step}`).classList.remove('hidden');
    currentStep = step;
}

async function handleComplete() {
    const btn = document.getElementById('ob-complete-btn');
    btn.disabled = true;
    btn.textContent = 'Saving Profile...';

    const result = await createCreatorProfile(profileData);
    if (result.success) {
        window.location.reload(); 
    } else {
        window.showToast(result.error, 'danger');
        btn.disabled = false;
        btn.textContent = 'Complete Setup ✦';
    }
}
