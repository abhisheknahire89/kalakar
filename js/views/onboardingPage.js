import { account, databases, storage, ID, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';

const STORAGE_KEY = 'kalakar_onboarding_state_v1';

const form = document.getElementById('onboarding-form');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const steps = Array.from(document.querySelectorAll('[data-step-content]'));
const indicators = Array.from(document.querySelectorAll('.step-indicator span'));
const errorBox = document.getElementById('wizard-error');
const successBox = document.getElementById('wizard-success');

let currentStep = 1;
let state = {
  role: 'Actor',
  name: '',
  username: '',
  city: 'Mumbai',
  language: 'Marathi',
  experience: 'Beginner',
  bio: '',
  avatarFileId: '',
  mediaFileId: ''
};

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function showSuccess(message) {
  successBox.textContent = message;
  successBox.classList.remove('hidden');
}

function clearMessages() {
  errorBox.textContent = '';
  successBox.textContent = '';
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state = { ...state, ...parsed };

    const roleInput = form.querySelector(`input[name="role"][value="${state.role}"]`);
    if (roleInput) roleInput.checked = true;

    form.name.value = state.name;
    form.username.value = state.username;
    form.city.value = state.city;
    form.language.value = state.language;
    form.experience.value = state.experience;
    form.bio.value = state.bio;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function syncStateFromForm() {
  const selectedRole = form.querySelector('input[name="role"]:checked');

  state.role = selectedRole ? selectedRole.value : state.role;
  state.name = form.name.value.trim();
  state.username = form.username.value.trim();
  state.city = form.city.value;
  state.language = form.language.value;
  state.experience = form.experience.value;
  state.bio = form.bio.value.trim();

  persistState();
}

function renderStep() {
  steps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.stepContent) === currentStep);
  });

  indicators.forEach((dot) => {
    dot.classList.toggle('active', Number(dot.dataset.step) <= currentStep);
  });

  prevBtn.disabled = currentStep === 1;
  nextBtn.classList.toggle('hidden', currentStep === steps.length);
  submitBtn.classList.toggle('hidden', currentStep !== steps.length);
}

function validateStep(stepNumber) {
  syncStateFromForm();

  if (stepNumber === 2) {
    if (!state.name) return 'Name is required.';
    if (!state.username) return 'Username is required.';
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(state.username)) {
      return 'Username must be 3-30 chars and only letters, numbers, _, ., -';
    }
  }

  return '';
}

async function uploadOptionalFile(file, bucketId) {
  if (!file) return '';

  const created = await storage.createFile(bucketId, ID.unique(), file);
  return created && created.$id ? created.$id : '';
}

async function submitProfile() {
  clearMessages();
  syncStateFromForm();

  const validationError = validateStep(currentStep);
  if (validationError) {
    showError(validationError);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const avatarFile = form.avatar.files && form.avatar.files[0] ? form.avatar.files[0] : null;
    const mediaFile = form.media.files && form.media.files[0] ? form.media.files[0] : null;

    const [avatarFileId, mediaFileId] = await Promise.all([
      uploadOptionalFile(avatarFile, BUCKETS.AVATARS),
      uploadOptionalFile(mediaFile, BUCKETS.AVATARS)
    ]);

    state.avatarFileId = avatarFileId;
    state.mediaFileId = mediaFileId;

    const user = await account.get();

    const composedBio = [
      state.bio,
      `Role: ${state.role}`,
      `Experience: ${state.experience}`,
      state.mediaFileId ? `Media: ${state.mediaFileId}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CREATORS,
      ID.unique(),
      {
        name: state.name,
        username: state.username,
        bio: composedBio,
        avatarFileId: state.avatarFileId,
        city: state.city,
        language: state.language,
        isVerified: false,
        createdAt: new Date().toISOString()
      }
    );

    localStorage.removeItem(STORAGE_KEY);
    showSuccess(`Welcome ${user && user.name ? user.name : state.name}. Profile setup complete.`);

    setTimeout(() => {
      window.location.href = './stage.html';
    }, 1000);
  } catch (error) {
    showError(error && error.message ? error.message : 'Failed to complete onboarding.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
}

prevBtn.addEventListener('click', () => {
  clearMessages();
  syncStateFromForm();
  currentStep = Math.max(1, currentStep - 1);
  renderStep();
});

nextBtn.addEventListener('click', () => {
  clearMessages();
  const validationError = validateStep(currentStep);
  if (validationError) {
    showError(validationError);
    return;
  }

  currentStep = Math.min(steps.length, currentStep + 1);
  renderStep();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  await submitProfile();
});

form.addEventListener('input', syncStateFromForm);

hydrateState();
renderStep();
