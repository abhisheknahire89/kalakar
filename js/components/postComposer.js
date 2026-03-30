import { databases, storage, ID, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';
import { renderStage } from './feed.js';
import { StorageServiceInstance as StorageService } from './core.js';
import { showToast } from './toast.js';

let selectedFile = null;

export function initPostComposer() {
  const existing = document.getElementById('post-composer-modal');
  if (existing) existing.remove();

  const userProfile = StorageService.get('kalakar_user_profile');
  if (!userProfile) return;

  const composerContainer = document.createElement('div');
  composerContainer.id = 'post-composer-modal';
  composerContainer.className = 'modal-overlay hidden';
  
  const avatarUrl = userProfile.avatarFileId ? 
    storage.getFilePreview(BUCKETS.avatars, userProfile.avatarFileId, 100).href : 
    `https://i.pravatar.cc/100?u=${userProfile.$id}`;

  composerContainer.innerHTML = `
    <div class="modal-content panel profile-large" style="max-width: 500px; padding: 24px;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.4rem;">Share your craft</h2>
        <button id="close-composer-btn" class="ghost small" style="font-size: 1.5rem;">&times;</button>
      </header>

      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <img src="${avatarUrl}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;">
        <div>
          <div style="font-weight: 700;">${userProfile.name}</div>
          <div class="meta" style="font-size: 0.8rem;">Posting to The Stage</div>
        </div>
      </div>

      <textarea id="composer-caption" placeholder="What are you working on? #Acting #DOP #Mumbai" style="width: 100%; height: 120px; background: transparent; border: none; color: var(--text); resize: none; font-size: 1.1rem; padding: 0; outline: none; margin-bottom: 16px;"></textarea>

      <div id="composer-drop-zone" style="border: 2px dashed var(--line); border-radius: 12px; padding: 32px; text-align: center; cursor: pointer; position: relative;">
        <div id="drop-zone-content">
          <span style="font-size: 2rem;">📹</span>
          <p class="meta mt-2">Upload Video or Photo</p>
          <p class="meta" style="font-size: 0.75rem;">Max 100MB · MP4/MOV/JPG</p>
        </div>
        <video id="composer-preview-video" class="hidden" style="width: 100%; border-radius: 12px;" controls playsinline></video>
        <img id="composer-preview-img" class="hidden" style="width: 100%; border-radius: 12px;">
        <input type="file" id="composer-file-input" hidden accept="video/*,image/*">
      </div>

      <div id="composer-upload-status" class="hidden mt-4">
        <div class="meta mb-1">Uploading... <span id="upload-pct">0%</span></div>
        <div style="width: 100%; height: 4px; background: var(--surface-2); border-radius: 2px; overflow: hidden;">
          <div id="upload-progress-bar" style="width: 0%; height: 100%; background: var(--brand-gold); transition: width 0.3s;"></div>
        </div>
      </div>

      <div style="margin-top: 24px; display: flex; align-items: center; gap: 12px;">
        <label style="display: flex; align-items: center; gap: 8px; color: var(--brand-gold); cursor: pointer; font-size: 0.9rem;">
          <input type="checkbox" id="composer-link-prompt" style="accent-color: var(--brand-gold);"> Link to Weekly Prompt
        </label>
      </div>

      <button id="composer-post-btn" class="primary full-width mt-4" style="padding: 14px; font-weight: 700; background: var(--brand-gold); color: black;" disabled>Post to Stage ✦</button>
    </div>
  `;

  document.body.appendChild(composerContainer);

  const modal = document.getElementById('post-composer-modal');
  const fileInput = document.getElementById('composer-file-input');
  const dropZone = document.getElementById('composer-drop-zone');
  const postBtn = document.getElementById('composer-post-btn');
  const caption = document.getElementById('composer-caption');

  document.getElementById('close-composer-btn').onclick = () => {
      modal.classList.add('hidden');
      reset();
  };

  dropZone.onclick = (e) => {
    if (e.target.id !== 'composer-preview-video') fileInput.click();
  };

  fileInput.onchange = (e) => {
    selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    document.getElementById('drop-zone-content').classList.add('hidden');
    if (selectedFile.type.startsWith('video/')) {
        const url = URL.createObjectURL(selectedFile);
        const video = document.getElementById('composer-preview-video');
        video.src = url;
        video.classList.remove('hidden');
    } else {
        const url = URL.createObjectURL(selectedFile);
        const img = document.getElementById('composer-preview-img');
        img.src = url;
        img.classList.remove('hidden');
    }
    postBtn.disabled = false;
  };

  caption.oninput = () => {
      if (caption.value.trim().length > 0 || selectedFile) postBtn.disabled = false;
      else postBtn.disabled = true;
  };

  postBtn.onclick = async () => {
    if (caption.value.trim().length === 0 && !selectedFile) return;
    
    postBtn.disabled = true;
    postBtn.textContent = 'Preparing...';
    
    const status = document.getElementById('composer-upload-status');
    const progress = document.getElementById('upload-progress-bar');
    const pct = document.getElementById('upload-pct');
    status.classList.remove('hidden');

    try {
      let fileId = null;
      let thumbId = null;

      if (selectedFile) {
        pct.textContent = '30%';
        progress.style.width = '30%';
        
        const result = await storage.createFile(BUCKETS.avatars, ID.unique(), selectedFile);
        fileId = result.$id;

        pct.textContent = '70%';
        progress.style.width = '70%';
      }

      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.posts,
        ID.unique(),
        {
          authorId: userProfile.$id, // Uses the $id of the profile doc
          contentText: caption.value,
          videoFileId: fileId,
          category: userProfile.primaryCraft.toLowerCase(),
          applaudCount: 0,
          commentCount: 0,
          isPromptLinked: document.getElementById('composer-link-prompt').checked,
          createdAt: new Date().toISOString()
        }
      );

      pct.textContent = '100%';
      progress.style.width = '100%';
      showToast('Cast successfully!', 'success');
      
      setTimeout(() => {
        modal.classList.add('hidden');
        reset();
        renderStage(); // Refresh feed
      }, 500);

    } catch (error) {
      console.error('Casting failed:', error);
      showToast('Casting failed. Try again.', 'danger');
      postBtn.disabled = false;
      postBtn.textContent = 'Post to Stage ✦';
    }
  };

  function reset() {
    selectedFile = null;
    caption.value = '';
    document.getElementById('drop-zone-content').classList.remove('hidden');
    document.getElementById('composer-preview-video').classList.add('hidden');
    document.getElementById('composer-preview-img').classList.add('hidden');
    document.getElementById('composer-upload-status').classList.add('hidden');
    document.getElementById('composer-progress-bar').style.width = '0%';
    postBtn.disabled = true;
    postBtn.textContent = 'Post to Stage ✦';
  }
}

export function openPostComposer() {
  const modal = document.getElementById('post-composer-modal');
  if (modal) {
    modal.classList.remove('hidden');
  } else {
    initPostComposer();
    const newModal = document.getElementById('post-composer-modal');
    if (newModal) newModal.classList.remove('hidden');
  }
}
