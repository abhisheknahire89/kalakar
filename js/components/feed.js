import { StorageServiceInstance as StorageService } from './core.js';
import { openTalentProfile } from './network.js';
import { openChat, renderChatList } from './chat.js';

const greenroomFeed = document.querySelector('#greenroom-feed');
const uploaderModal = document.querySelector('#uploader-modal');
const openUploadBtn = document.querySelector('#open-upload-btn');
const openUploadBtnMobile = document.querySelector('#open-upload-btn-mobile');
const closeUploadBtn = document.querySelector('#close-uploader-btn');
const fileInput = document.querySelector('#file-input');
const uploadArea = document.querySelector('#drop-zone');
const uploadingState = document.querySelector('#uploading-state');
const uploadProgress = document.querySelector('#upload-progress');

export async function renderStage() {
  const creators = await fetchCreatorsFromDB();
  greenroomFeed.innerHTML = '';

  // Inject Skeleton Loaders immediately
  greenroomFeed.innerHTML = `
    <div class="video-slot" style="padding: 16px;">
      <div class="skeleton skeleton-video"></div>
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-actions"></div>
    </div>
    <div class="video-slot" style="padding: 16px;">
      <div class="skeleton skeleton-video"></div>
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-actions"></div>
    </div>
  `;

  // Simulate network delay (1500ms)
  setTimeout(() => {
    // Clear skeletons
    greenroomFeed.innerHTML = '';

    // NOISE REDUCTION: Only show creators who are Verified OR have at least one Credit
    const verifiedCreators = creators.filter(c => c.verified === true || c.credits?.length > 0);

    if (verifiedCreators.length === 0) {
      greenroomFeed.innerHTML = '<div class="empty-state">No verified professionals found.</div>';
      return;
    }

    // Add Verification Banner
    const banner = document.createElement('div');
    banner.innerHTML = `<div style="background: rgba(255, 215, 0, 0.1); color: var(--brand-gold); padding: 0.5rem; text-align: center; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; border: 1px solid rgba(255, 215, 0, 0.2);">💎 Displaying Verified Professionals Only</div>`;
    greenroomFeed.appendChild(banner);

    verifiedCreators.forEach(creator => {
      const slot = document.createElement('div');
      slot.className = 'video-slot';
      slot.innerHTML = `
        <div class="video-card__media">
          <img src="${creator.videoUrl}" class="video-placeholder" alt="Proof of Craft">
          <div class="video-card__play-overlay">
            <div class="video-card__play-btn">▶</div>
          </div>
          
          <!-- Premium Glassmorphic Header -->
          <div class="video-card__glass-header">
            <div class="glass-badge highlight">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
              Vouched by ${creator.vouchedBy}
            </div>
            <div class="glass-badge">
              <span class="score-val score-val-${creator.id}">${creator.reliability || 98}%</span> Score
            </div>
          </div>
        </div>
        
        <div class="hire-overlay" style="position: relative; background: transparent; padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <!-- Unified Author Row -->
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(creator.name)}" class="user-avatar" style="width: 40px; height: 40px;" alt="Avatar">
            <div class="creator-info" style="margin: 0;">
              <div class="creator-name" style="font-size: 1.1rem; font-weight: 700;">
                ${creator.name} 
                ${creator.verified ? '<span class="verified-icon" title="Verified Professional">★</span>' : ''}
                <span style="font-size: 0.9rem; font-weight: 500; color: var(--brand-gold); margin-left: 8px;">[ ${creator.reliability || 98}% ]</span>
              </div>
              <p style="font-size: 0.85rem; color: var(--muted);">${creator.role} · ${creator.city || 'Mumbai'}</p>
            </div>
          </div>
          
          <div class="video-tags" style="margin-left: 52px; font-size: 0.8rem; color: var(--muted);">
            <span class="craft-tag">#${creator.tags?.[0] || 'Monologue'}</span>
            <span class="craft-tag">#${creator.tags?.[1] || 'Dramatic'}</span>
            <span class="craft-tag">#Intense</span>
          </div>

          <div class="action-row" style="margin-top: 12px; margin-left: 52px; display: flex; gap: 12px;">
            <button class="primary open-chat-btn" data-id="${creator.id}" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 20px;">Initiate Deal</button>
            <button class="ghost shortlist-talent-btn" data-id="${creator.id}" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 20px;">+ Shortlist</button>
            <button class="ghost vouch-talent-btn" data-id="${creator.id}" style="padding: 6px 16px; font-size: 0.85rem; border-radius: 20px;">👏 Vouch</button>
          </div>
        </div>
      `;
      greenroomFeed.appendChild(slot);
    });

    // Attach Intersection Observer to newly rendered videos for P0 Performance
    if (window.kalakarVideoObserver) {
      document.querySelectorAll('.video-placeholder').forEach(video => {
        window.kalakarVideoObserver.observe(video);
      });
    }

    // Reattach all event listeners inside the timeout
    document.querySelectorAll('.view-prof-btn').forEach(btn => {
      btn.addEventListener('click', () => openTalentProfile(btn.dataset.id));
    });

    document.querySelectorAll('.vouch-talent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.vouched) return; // prevent double click
        btn.dataset.vouched = 'true';

        btn.style.background = 'var(--brand-gold)';
        btn.style.color = 'black';
        btn.innerHTML = '<span class="vouch-icon">✓</span><small>Vouched</small>';

        // WEIGHTED Vouch Sync
        const id = btn.dataset.id;
        const creators = StorageService.get('kalakar_creators') || [];
        const creatorIndex = creators.findIndex(c => c.id === id);
        if (creatorIndex > -1) {
          creators[creatorIndex].vp = (creators[creatorIndex].vp || 0) + 1; // Increment VP for trending
          // Weighted logic: Vouching by a verified user adds 5% instead of 1%
          creators[creatorIndex].reliability = Math.min(100, (creators[creatorIndex].reliability || 98) + 5);
          StorageService.set('kalakar_creators', creators);

          // Update UI optimistically
          const scoreEl = document.querySelector(`.score-val-${id}`);
          if (scoreEl) scoreEl.textContent = creators[creatorIndex].reliability + '%';

          const cardScoreEl = document.querySelector(`#prof-rel-score`);
          if (cardScoreEl && document.querySelector('#prof-name').textContent === creators[creatorIndex].name) {
            cardScoreEl.textContent = creators[creatorIndex].reliability + '%';
          }

          renderTrendingWidget(); // re-render trending
        }
      });
    });

    document.querySelectorAll('.shortlist-talent-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.style.background = 'var(--brand-gold)';
        btn.style.color = 'black';
        btn.innerHTML = '<span>SAVED</span>';

        const id = btn.dataset.id;
        const shortlist = StorageService.get('kalakar_shortlist') || [];
        if (!shortlist.includes(id)) {
          shortlist.push(id);
          StorageService.set('kalakar_shortlist', shortlist);
          renderShortlist(); // Update the manager view
        }
      });
    });

    document.querySelectorAll('.open-chat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openChat(btn.dataset.id);
      });
    });

  }, 1500); // 1.5s loader duration
}

// Uploader Logic
const uploaderModal = document.querySelector('#uploader-modal');
const openUploadBtn = document.querySelector('#open-upload-btn');
const openUploadBtnMobile = document.querySelector('#open-upload-btn-mobile');
const closeUploadBtn = document.querySelector('#close-uploader-btn');
const fileInput = document.querySelector('#file-input');
const uploadArea = document.querySelector('#drop-zone');
const uploadingState = document.querySelector('#uploading-state');
const uploadProgress = document.querySelector('#upload-progress');

if (openUploadBtn) {
  openUploadBtn.addEventListener('click', () => {
    uploaderModal.classList.add('active');
  });
}

if (openUploadBtnMobile) {
  openUploadBtnMobile.addEventListener('click', () => {
    uploaderModal.classList.add('active');
  });
}

if (closeUploadBtn) {
  closeUploadBtn?.addEventListener('click', () => {
    uploaderModal.classList.remove('active');
    // Reset state
    uploadArea.classList.remove('hidden');
    uploadingState.classList.add('hidden');
  });
}

if (fileInput) {
  fileInput?.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      await handleRealUpload(file);
    }
  });
}

// Phase 35: Advanced Supabase Storage Integration
export async function handleRealUpload(file) {
  uploadArea.classList.add('hidden');
  uploadingState.classList.remove('hidden');
  uploadProgress.textContent = '0%';

  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) throw new Error("Must be logged in to upload");

    uploadProgress.textContent = 'Uploading...';

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await window.supabaseClient.storage
      .from('kalakar-reels')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    uploadProgress.textContent = 'Linking...';

    const { data: publicUrlData } = window.supabaseClient.storage
      .from('kalakar-reels')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update creators table
    const { error: updateError } = await window.supabaseClient
      .from('creators')
      .update({ videoUrl: publicUrl })
      .eq('id', user.id);

    if (updateError) throw updateError;

    uploadProgress.textContent = '100%';
    setTimeout(() => {
      alert("Craft Vouched! Your reel is now live on The Stage.");
      uploaderModal.classList.remove('active');
      uploadArea.classList.remove('hidden');
      uploadingState.classList.add('hidden');
      fileInput.value = ''; // clear input

      // Refresh the stage to show new video
      renderStage();
    }, 800);

  } catch (err) {
    console.error("Upload failed:", err);
    alert("Upload failed. Ensure 'kalakar-reels' bucket exists and is public.");
    uploadArea.classList.remove('hidden');
    uploadingState.classList.add('hidden');
    fileInput.value = ''; // clear input
  }
}
export function renderTrendingWidget() {
  const trendingList = document.querySelector('#trending-list');
  if (!trendingList) return;

  const creators = StorageService.get('kalakar_creators') || [];

  // Simulate trending logic based on random high vouch counts for the demo
  const trendingData = [
    { name: creators[0]?.name || 'Ishaan Verma', role: 'Actor/Dancer', vouches: 84 },
    { name: 'Priya Joshi', role: 'Writer', vouches: 62 },
    { name: creators[1]?.name || 'Alisha Rao', role: 'Cinematographer', vouches: 45 }
  ];

  trendingList.innerHTML = trendingData.map(t => `
    <div class="trending-item">
      <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(t.name)}" class="trending-item__avatar" alt="Avatar">
      <div class="trending-item__info">
        <div class="trending-item__name">${t.name}</div>
        <div class="trending-item__role">
          ${t.role} <span class="trending-item__vouch">✓ ${t.vouches}</span>
        </div>
      </div>
      <button class="trending-item__add">+ Add</button>
    </div>
  `).join('');
}
