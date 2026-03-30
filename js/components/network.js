import { databases, Query, ID, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService } from './core.js';
import { openChat } from './chat.js';
import { showToast } from './toast.js';

const talentGrid = document.querySelector('#talent-grid');
const talentProfileModal = document.querySelector('#talent-profile-modal');

export async function renderNetworkBoard(departmentFilter = 'All', searchQuery = '') {
  if (!talentGrid) return;

  // 1. Skeleton UI
  talentGrid.innerHTML = Array(6).fill(`
    <div class="card talent-card transition-elegant" style="padding: 16px;">
      <div style="display:flex; gap:16px;">
        <div class="skeleton" style="width: 60px; height: 60px; border-radius: 50%;"></div>
        <div style="flex:1;">
          <div class="skeleton" style="height: 16px; width: 60%; margin-bottom: 8px;"></div>
          <div class="skeleton" style="height: 12px; width: 40%;"></div>
        </div>
      </div>
    </div>
  `).join('');

  try {
    const queries = [Query.limit(20)];

    if (departmentFilter !== 'All') {
      queries.push(Query.equal('primaryCraft', departmentFilter));
    }

    if (searchQuery && searchQuery.trim() !== '') {
      queries.push(Query.search('name', searchQuery));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.creators,
      queries
    );

    talentGrid.innerHTML = '';
    const myProfile = StorageService.get('kalakar_user_profile');

    if (response.documents.length === 0) {
      talentGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center;">No creative profiles found matching your filters.</div>';
      return;
    }

    response.documents.forEach(creator => {
      if (myProfile && creator.$id === myProfile.$id) return;

      const card = document.createElement('div');
      card.className = 'talent-card transition-elegant card';
      card.style.cursor = 'pointer';

      const avatar = creator.avatarFileId ? 
        storage.getFilePreview(BUCKETS.avatars, creator.avatarFileId, 100).href : 
        `https://i.pravatar.cc/100?u=${creator.$id}`;

      card.innerHTML = `
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 12px;">
          <img src="${avatar}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--line);">
          <div>
            <h3 style="margin:0; font-size: 1.1rem;">${creator.name} ${creator.isVerified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}</h3>
            <p class="meta" style="font-size: 0.85rem;">${creator.primaryCraft} · ${creator.city}</p>
          </div>
        </div>
        <div class="talent-tags" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
            <span class="talent-tag" style="background: var(--surface-2); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">⭐ ${creator.vouchCount || 0} Vouches</span>
            <span class="talent-tag" style="background: var(--surface-2); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${creator.reliability || 80}% Reliable</span>
        </div>
        <button class="primary action-gold connect-btn" data-id="${creator.$id}" style="width: 100%; border-radius: 20px; font-weight: 600;">Hire / Connect</button>
      `;

      card.onclick = (e) => {
        if (!e.target.closest('.connect-btn')) openTalentProfile(creator.$id);
      };

      card.querySelector('.connect-btn').onclick = () => openTalentProfile(creator.$id);

      talentGrid.appendChild(card);
    });

  } catch (error) {
    console.error('Network fetch error:', error);
    talentGrid.innerHTML = '<p class="text-center meta">Failed to load creators.</p>';
  }
}

export async function openTalentProfile(creatorId) {
  const modal = document.getElementById('talent-profile-modal');
  if (!modal) return;

  try {
    const creator = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.creators,
      creatorId
    );

    // Populate UI
    document.getElementById('tp-name').innerHTML = `${creator.name} ${creator.isVerified ? '<span style="color:var(--brand-gold);">★</span>' : ''}`;
    document.getElementById('tp-role-city').textContent = `${creator.primaryCraft} · ${creator.city}`;
    
    const avatarContainer = document.getElementById('tp-avatar-container');
    const avatar = creator.avatarFileId ? 
        storage.getFilePreview(BUCKETS.avatars, creator.avatarFileId, 200).href : 
        `https://i.pravatar.cc/200?u=${creator.$id}`;
    avatarContainer.innerHTML = `<img src="${avatar}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--surface-2);">`;

    // Action Row
    let actionRow = document.getElementById('tp-action-row');
    if (!actionRow) {
        actionRow = document.createElement('div');
        actionRow.id = 'tp-action-row';
        document.querySelector('.profile-header-large').appendChild(actionRow);
    }
    actionRow.style.display = 'flex';
    actionRow.style.gap = '12px';
    actionRow.style.marginTop = '20px';
    actionRow.innerHTML = `
        <button class="primary action-gold" id="tp-msg-btn" style="flex: 1; border-radius: 8px;">💬 Message</button>
        <button class="ghost" id="tp-vouch-btn" style="flex: 1; border-radius: 8px; border: 1px solid var(--brand-gold); color: var(--brand-gold);">⭐ Vouch</button>
    `;

    document.getElementById('tp-msg-btn').onclick = () => openChat(creator.$id);
    document.getElementById('tp-vouch-btn').onclick = () => {
        import('./vouchModal.js').then(m => m.openVouchModal(creator.name, creator.primaryCraft, creator.$id));
    };

    // Credits Timeline
    const creditsContainer = document.getElementById('tp-credits');
    creditsContainer.innerHTML = '<div class="skeleton" style="height: 100px; width: 100%;"></div>';
    
    const creditsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.credits,
        [Query.equal('talentId', creatorId), Query.orderDesc('year')]
    );

    creditsContainer.innerHTML = '';
    if (creditsResponse.documents.length === 0) {
        creditsContainer.innerHTML = '<p class="meta text-center py-4">No verified credits yet.</p>';
    } else {
        creditsResponse.documents.forEach((credit, idx) => {
            const item = document.createElement('div');
            item.className = 'credit-timeline-item';
            item.style.position = 'relative';
            item.style.paddingLeft = '24px';
            item.style.marginBottom = '20px';
            item.innerHTML = `
                <div style="position: absolute; left: 0; top: 8px; width: 12px; height: 12px; border-radius: 50%; background: ${credit.isVerified ? 'var(--success)' : 'var(--muted)'};"></div>
                <div style="position: absolute; left: 5px; top: 20px; bottom: -20px; width: 2px; background: var(--line); display: ${idx === creditsResponse.documents.length - 1 ? 'none' : 'block'};"></div>
                <div style="font-weight: 700; font-size: 0.95rem;">"${credit.projectTitle}"</div>
                <div class="meta" style="font-size: 0.8rem;">${credit.role} · ${credit.year}</div>
                ${credit.isVerified ? `<div style="font-size: 0.7rem; color: var(--success); margin-top: 4px;">Verified by ${credit.verifiedBy}</div>` : ''}
            `;
            creditsContainer.appendChild(item);
        });
    }

    modal.classList.add('active');

  } catch (error) {
    console.error('Profile load error:', error);
    showToast('Failed to load profile', 'danger');
  }
}

// Search Listeners
document.getElementById('talent-search-input')?.addEventListener('input', (e) => {
    const activeDept = document.querySelector('#network-view .filter-pill.active')?.textContent || 'All';
    renderNetworkBoard(activeDept, e.target.value);
});

document.querySelectorAll('#network-view .filter-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('#network-view .filter-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      renderNetworkBoard(e.target.textContent, document.getElementById('talent-search-input')?.value || '');
    });
});
