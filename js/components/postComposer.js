import { createPost, getProfileSnapshot } from '../services/appData.js';
import { getFilePreviewUrl, BUCKETS } from '../appwriteClient.js';
import { renderStage } from './feed.js';
import { showToast } from './toast.js';

let modalBound = false;
let selectedFile = null;

function ensureModal() {
  let modal = document.getElementById('post-composer-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'post-composer-modal';
  modal.className = 'modal-overlay hidden';
  modal.innerHTML = `
    <div class="modal-content panel beta-composer">
      <header class="beta-composer-header">
        <div>
          <p class="beta-kicker">Create</p>
          <h2>Post to the stage</h2>
        </div>
        <button id="composer-close-btn" class="ghost small" aria-label="Close composer">Close</button>
      </header>

      <div class="beta-composer-profile">
        <img id="composer-avatar" class="beta-avatar" alt="Your avatar" />
        <div>
          <strong id="composer-name">You</strong>
          <p class="meta">Text, image, video, or a mixed update.</p>
        </div>
      </div>

      <textarea id="composer-caption" class="beta-composer-textarea" placeholder="What are you building, shooting, casting, or learning this week?"></textarea>

      <label class="beta-upload-card" for="composer-file-input">
        <input type="file" id="composer-file-input" accept="image/*,video/*" hidden />
        <div id="composer-upload-copy">
          <strong>Add media</strong>
          <p class="meta">Images and vertical videos both work here.</p>
        </div>
        <div id="composer-preview"></div>
      </label>

      <div id="composer-error" class="meta" style="color:#ff8b8b; min-height: 20px;"></div>

      <div class="beta-composer-actions">
        <button id="composer-clear-btn" class="ghost">Reset</button>
        <button id="composer-submit-btn" class="primary action-gold">Publish</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function resetComposer() {
  selectedFile = null;
  const caption = document.getElementById('composer-caption');
  const preview = document.getElementById('composer-preview');
  const copy = document.getElementById('composer-upload-copy');
  const error = document.getElementById('composer-error');
  const input = document.getElementById('composer-file-input');

  if (caption) caption.value = '';
  if (preview) preview.innerHTML = '';
  if (copy) copy.classList.remove('hidden');
  if (error) error.textContent = '';
  if (input) input.value = '';
}

function renderPreview(file) {
  const preview = document.getElementById('composer-preview');
  const copy = document.getElementById('composer-upload-copy');
  if (!preview || !copy) return;

  const objectUrl = URL.createObjectURL(file);
  copy.classList.add('hidden');
  preview.innerHTML = file.type.startsWith('video/')
    ? `<video src="${objectUrl}" controls playsinline></video>`
    : `<img src="${objectUrl}" alt="Selected upload preview" />`;
}

function bindModal() {
  if (modalBound) return;
  modalBound = true;

  const modal = ensureModal();
  const close = () => {
    modal.classList.add('hidden');
    resetComposer();
  };

  document.getElementById('composer-close-btn')?.addEventListener('click', close);
  document.getElementById('composer-clear-btn')?.addEventListener('click', resetComposer);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });

  document.getElementById('composer-file-input')?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    selectedFile = file;
    renderPreview(file);
  });

  document.getElementById('composer-submit-btn')?.addEventListener('click', async () => {
    const caption = document.getElementById('composer-caption');
    const submit = document.getElementById('composer-submit-btn');
    const error = document.getElementById('composer-error');

    submit.disabled = true;
    submit.textContent = 'Publishing...';
    if (error) error.textContent = '';

    try {
      await createPost({ caption: caption?.value || '', file: selectedFile });
      showToast('Post published to your feed.', 'success');
      close();
      await renderStage();
    } catch (reason) {
      if (error) error.textContent = reason?.message || 'Could not publish your post.';
      showToast(reason?.message || 'Could not publish your post.', 'danger');
    } finally {
      submit.disabled = false;
      submit.textContent = 'Publish';
    }
  });
}

export function openPostComposer() {
  const modal = ensureModal();
  bindModal();

  const profile = getProfileSnapshot();
  const avatar = document.getElementById('composer-avatar');
  const name = document.getElementById('composer-name');

  if (avatar) {
    avatar.src = profile?.avatarFileId
      ? getFilePreviewUrl(BUCKETS.AVATARS || BUCKETS.avatars, profile.avatarFileId)
      : `https://i.pravatar.cc/120?u=${encodeURIComponent(profile?.$id || 'kalakar')}`;
  }
  if (name) name.textContent = profile?.name || 'Your profile';

  modal.classList.remove('hidden');
}
