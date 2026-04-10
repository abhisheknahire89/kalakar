import { createCreatorProfile } from '../auth.js';
import { storage, ID, BUCKETS } from '../appwriteClient.js';
import { showToast } from '../components/toast.js';

const profileDraft = {
  primaryCraft: 'Actor',
  accountType: 'talent',
  name: '',
  city: 'Mumbai',
  avatarFileId: '',
  yearsExperience: 0,
  reelFileId: '',
  bio: ''
};

let currentStep = 1;

function goToStep(step) {
  currentStep = Math.max(1, Math.min(4, step));
  document.querySelectorAll('.ob-step').forEach((node) => node.classList.add('hidden'));
  document.getElementById(`ob-step-${currentStep}`)?.classList.remove('hidden');
}

async function uploadFile(file, bucketId) {
  const result = await storage.createFile(bucketId, ID.unique(), file);
  return result.$id;
}

export function initOnboardingView() {
  if (document.body.dataset.onboardingBound === '1') {
    goToStep(1);
    return;
  }
  document.body.dataset.onboardingBound = '1';

  document.querySelectorAll('.craft-select').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.craft-select').forEach((node) => node.classList.remove('active'));
      button.classList.add('active');
      profileDraft.primaryCraft = button.dataset.craft || 'Actor';
    });
  });

  document.querySelectorAll('.account-select-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.account-select-card').forEach((node) => node.classList.remove('active'));
      card.classList.add('active');
      profileDraft.accountType = card.dataset.type || 'talent';
    });
  });

  document.querySelectorAll('.ob-next-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (currentStep === 2) {
        profileDraft.name = String(document.getElementById('ob-name')?.value || '').trim();
        profileDraft.city = String(document.getElementById('ob-city')?.value || 'Mumbai').trim();
        profileDraft.bio = `${profileDraft.primaryCraft} based in ${profileDraft.city}.`;

        if (!profileDraft.name) {
          showToast('Add your display name to continue.', 'danger');
          return;
        }
      }

      if (currentStep === 3) {
        profileDraft.yearsExperience = Number(document.getElementById('ob-exp')?.value || 0);
      }

      goToStep(currentStep + 1);
    });
  });

  document.querySelectorAll('.ob-prev-btn').forEach((button) => {
    button.addEventListener('click', () => goToStep(currentStep - 1));
  });

  document.getElementById('ob-avatar-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const preview = document.getElementById('ob-avatar-preview');
    if (preview) preview.innerHTML = '<span class="spinner"></span>';

    try {
      const avatarFileId = await uploadFile(file, BUCKETS.AVATARS || BUCKETS.avatars);
      profileDraft.avatarFileId = avatarFileId;
      if (preview) {
        preview.innerHTML = `<img src="${storage.getFilePreview(BUCKETS.AVATARS || BUCKETS.avatars, avatarFileId, 160, 160).href}" alt="Avatar preview" style="width:100%;height:100%;object-fit:cover;">`;
      }
    } catch (_) {
      if (preview) preview.textContent = '📸';
      showToast('Avatar upload failed. You can continue without it.', 'danger');
    }
  });

  document.getElementById('ob-reel-drop')?.addEventListener('click', () => {
    document.getElementById('ob-reel-input')?.click();
  });

  document.getElementById('ob-reel-input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reelDrop = document.getElementById('ob-reel-drop');
    if (reelDrop) reelDrop.innerHTML = '<p class="meta">Uploading reel...</p>';

    try {
      profileDraft.reelFileId = await uploadFile(file, BUCKETS.REELS || BUCKETS.reels || BUCKETS.POST_MEDIA || BUCKETS.post_media);
      if (reelDrop) reelDrop.innerHTML = '<p class="meta" style="color:var(--brand-gold);">Showreel uploaded</p>';
    } catch (_) {
      if (reelDrop) reelDrop.innerHTML = '<span style="font-size: 2rem;">📹</span><p class="meta">Upload Video (Max 50MB)</p><input type="file" id="ob-reel-input" hidden accept="video/*">';
      showToast('Reel upload failed. You can complete setup without it.', 'danger');
    }
  });

  const complete = async () => {
    const completeButton = document.getElementById('ob-complete-btn');
    if (completeButton) {
      completeButton.disabled = true;
      completeButton.textContent = 'Setting up your profile...';
    }

    const result = await createCreatorProfile(profileDraft);
    if (!result.success) {
      showToast(result.error?.message || 'We could not finish onboarding.', 'danger');
      if (completeButton) {
        completeButton.disabled = false;
        completeButton.textContent = 'Complete Setup ✦';
      }
      return;
    }

    showToast('Profile ready. Welcome to Kalakar beta.', 'success');
    window.location.hash = '#feed';
    window.location.reload();
  };

  document.getElementById('ob-complete-btn')?.addEventListener('click', complete);
  document.getElementById('ob-skip-reel')?.addEventListener('click', complete);

  goToStep(1);
}
