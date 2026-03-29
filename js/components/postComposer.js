import { renderStage } from './feed.js';

export function initPostComposer() {
  const composerContainer = document.createElement('div');
  composerContainer.id = 'post-composer-modal';
  composerContainer.className = 'modal-overlay hidden';
  composerContainer.innerHTML = `
    <div class="modal-content panel profile-large" style="max-width: 560px; padding: 20px; text-align: left; background: var(--bg-primary);">
      <header class="modal-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 1.5rem; margin: 0;">Create Post</h2>
        <button class="close-btn" id="close-composer-btn" style="background:none; border:none; font-size: 1.5rem; color: var(--text); cursor:pointer;">&times;</button>
      </header>

      <div class="modal-author-row" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <img src="https://i.pravatar.cc/150?img=11" alt="Profile" class="user-avatar" style="width: 48px; height: 48px; border-radius: 50%;">
        <div class="author-info">
          <h3 class="author-name" style="font-size: 1.05rem; margin:0;">Ishaan Verma</h3>
          <select class="subtle-select" style="font-size: 0.85rem; padding: 2px 4px; margin-top: 4px; background: var(--bg-elevated); border: 1px solid var(--line); color: var(--text);">
            <option>🌍 Anyone</option>
            <option>Connections Only</option>
          </select>
        </div>
      </div>

      <div class="composer-input-area" style="position: relative;">
        <!-- Backdrop for highlighting -->
        <div class="composer-highlights" style="position: absolute; top: 0; left: 0; width: 100%; height: 100px; padding: 12px; font-family: inherit; font-size: 1rem; color: transparent; pointer-events: none; white-space: pre-wrap; word-wrap: break-word;"></div>
        <textarea id="composer-caption" style="width: 100%; height: 100px; background: transparent; color: var(--text); border: none; resize: none; font-size: 1rem; padding: 12px; font-family: inherit;" placeholder="What do you want to showcase?"></textarea>
      </div>

      <div class="composer-media-zone" id="composer-drop-zone" style="border: 2px dashed var(--line); border-radius: 12px; padding: 32px; text-align: center; margin: 16px 0; cursor: pointer; transition: border-color 0.2s;">
        <span style="font-size: 2rem; display: block; margin-bottom: 8px;">📹</span>
        <p style="margin:0; color: var(--muted);">Click or drag video to upload</p>
        <input type="file" id="composer-file-input" hidden accept="video/*,image/*">
        <video id="composer-preview" class="hidden" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; margin-top: 12px;" controls playsinline></video>
      </div>

      <div id="composer-uploading-state" class="hidden" style="text-align: center; margin-bottom: 16px;">
        <p class="meta" style="margin-bottom: 8px;">Uploading... <span id="composer-upload-progress">0%</span></p>
        <div style="width: 100%; height: 4px; background: var(--bg-hover); border-radius: 2px; overflow: hidden;">
          <div id="composer-progress-bar" style="width: 0%; height: 100%; background: var(--brand-gold); transition: width 0.2s;"></div>
        </div>
      </div>

      <div class="composer-options" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px;">
          <span>📍</span>
          <input type="text" id="composer-location" placeholder="Add location" style="flex:1; background:transparent; border:none; color:var(--text); outline:none; font-size: 0.9rem;">
        </div>
        
        <label class="prompt-toggle" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 8px; font-size: 0.9rem; color: var(--brand-gold); cursor: pointer;">
          <input type="checkbox" id="composer-link-prompt" style="accent-color: var(--brand-gold);">
          Link to Weekly Prompt: "The Final Negotiation"
        </label>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line); padding-top: 16px;">
        <div class="media-type-row" style="display: flex; gap: 8px;">
          <button class="icon-btn" onclick="document.getElementById('composer-file-input').click()" style="color:var(--text); background:var(--bg-elevated); padding:8px 12px; border-radius:20px; font-size:0.85rem;"><span class="icon">📹</span> Video</button>
          <button class="icon-btn" onclick="document.getElementById('composer-file-input').click()" style="color:var(--text); background:var(--bg-elevated); padding:8px 12px; border-radius:20px; font-size:0.85rem;"><span class="icon">📷</span> Photo</button>
        </div>
        <button class="primary action-gold" id="composer-post-btn" style="padding: 10px 24px; border-radius: 20px; font-weight: 600;" disabled>Post</button>
      </div>
    </div>
  `;

  document.body.appendChild(composerContainer);

  const modal = document.getElementById('post-composer-modal');
  const closeBtn = document.getElementById('close-composer-btn');
  const fileInput = document.getElementById('composer-file-input');
  const dropZone = document.getElementById('composer-drop-zone');
  const preview = document.getElementById('composer-preview');
  const postBtn = document.getElementById('composer-post-btn');
  const captionInput = document.getElementById('composer-caption');
  const highlights = document.querySelector('.composer-highlights');
  
  let selectedFile = null;

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    resetComposer();
  });

  const checkValidation = () => {
    if (selectedFile || captionInput.value.trim().length > 0) {
      postBtn.disabled = false;
    } else {
      postBtn.disabled = true;
    }
  };

  captionInput.addEventListener('input', () => {
    // Basic hashtag highlighting
    const text = captionInput.value;
    const highlightedText = text.replace(/(#[a-zA-Z0-9]+)/g, '<span style="color: var(--brand-gold);">$1</span>');
    highlights.innerHTML = highlightedText + ' '; // Added space for syncing scroll width if needed
    checkValidation();
  });

  captionInput.addEventListener('scroll', () => {
    highlights.scrollTop = captionInput.scrollTop;
  });

  dropZone.addEventListener('click', (e) => {
    if (e.target !== fileInput && e.target !== preview) {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--brand-gold)';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--line)';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--line)';
    if (e.dataTransfer.files.length) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileSelect(e.target.files[0]);
    }
  });

  function handleFileSelect(file) {
    selectedFile = file;
    checkValidation();
    if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.classList.remove('hidden');
      dropZone.querySelector('p').classList.add('hidden');
      dropZone.querySelector('span').classList.add('hidden');
    }
  }

  function generateThumbnail(videoElement) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      // Draw frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    });
  }

  postBtn.addEventListener('click', async () => {
    if (!selectedFile && !captionInput.value.trim()) return;

    postBtn.disabled = true;
    const uploadingState = document.getElementById('composer-uploading-state');
    const uploadProgress = document.getElementById('composer-upload-progress');
    const progressBar = document.getElementById('composer-progress-bar');
    uploadingState.classList.remove('hidden');

    try {
      let mediaFileId = null;
      let thumbnailFileId = null;

      if (selectedFile) {
        uploadProgress.textContent = '10%';
        progressBar.style.width = '10%';
        
        let thumbBlob = null;
        if (selectedFile.type.startsWith('video/')) {
           // wait for a frame to load to draw the thumbnail
           preview.currentTime = 1.0; 
           await new Promise(res => setTimeout(res, 500)); // wait a bit
           thumbBlob = await generateThumbnail(preview);
        }

        const user = (await window.supabaseClient.auth.getUser()).data.user;
        const uid = user ? user.id : 'anonymous';
        
        // Upload main file
        const fileName = \`\${uid}/\${Date.now()}_media.\${selectedFile.name.split('.').pop()}\`;
        const bucket = 'kalakar-reels'; // or post-media
        
        const { data, error } = await window.supabaseClient.storage.from(bucket).upload(fileName, selectedFile, { upsert: true });
        if (error) throw error;
        
        const { data: pubData } = window.supabaseClient.storage.from(bucket).getPublicUrl(fileName);
        mediaFileId = pubData.publicUrl;

        uploadProgress.textContent = '70%';
        progressBar.style.width = '70%';

        // Upload thumbnail
        if (thumbBlob) {
            const thumbName = \`\${uid}/\${Date.now()}_thumb.jpg\`;
            await window.supabaseClient.storage.from(bucket).upload(thumbName, thumbBlob, { upsert: true });
            const { data: thumbData } = window.supabaseClient.storage.from(bucket).getPublicUrl(thumbName);
            thumbnailFileId = thumbData.publicUrl;
        }
      }

      uploadProgress.textContent = '90%';
      progressBar.style.width = '90%';

      // Extract hashtags
      const caption = captionInput.value;
      const hashtags = (caption.match(/#[a-zA-Z0-9]+/g) || []).map(t => t.slice(1));

      // Build Post
      const post = {
        id: 'post_' + Math.random().toString(36).substr(2, 9),
        authorId: 'c1', // Mocked to current user
        contentText: caption,
        videoUrl: mediaFileId,
        thumbnailUrl: thumbnailFileId || '',
        hashtags: hashtags,
        location: document.getElementById('composer-location').value,
        applaudCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString()
      };

      // Mock DB save by adding to local state or reloading
      const storedPosts = JSON.parse(localStorage.getItem('kalakar_posts') || '[]');
      storedPosts.unshift(post);
      localStorage.setItem('kalakar_posts', JSON.stringify(storedPosts));

      uploadProgress.textContent = '100%';
      progressBar.style.width = '100%';

      setTimeout(() => {
        modal.classList.add('hidden');
        resetComposer();
        renderStage(); // refresh feed
        showToast('Post created successfully!', 'success');
      }, 500);

    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
      postBtn.disabled = false;
      uploadingState.classList.add('hidden');
    }
  });

  function resetComposer() {
    selectedFile = null;
    captionInput.value = '';
    highlights.innerHTML = '';
    preview.src = '';
    preview.classList.add('hidden');
    dropZone.querySelector('p').classList.remove('hidden');
    dropZone.querySelector('span').classList.remove('hidden');
    document.getElementById('composer-location').value = '';
    document.getElementById('composer-link-prompt').checked = false;
    document.getElementById('composer-uploading-state').classList.add('hidden');
    postBtn.disabled = true;
  }
}

function showToast(message, type = 'info') {
  // Simple toast
  alert(message);
}

export function openPostComposer() {
  document.getElementById('post-composer-modal').classList.remove('hidden');
}
