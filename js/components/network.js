import { StorageServiceInstance as StorageService } from './core.js';
import { openChat } from './chat.js';

const talentGrid = document.querySelector('#talent-grid');
const talentProfileModal = document.querySelector('#talent-profile-modal');

// Phase 37: Dynamic Supabase Queries
export async function fetchCreatorsFromDB(departmentFilter = 'All', searchQuery = '') {
  try {
    let query = window.supabaseClient.from('creators').select('*');

    // Edge Filter: Department
    if (departmentFilter !== 'All') {
      // Assuming 'dept' maps to department strings
      query = query.eq('dept', departmentFilter);
    }

    // Edge Filter: Search 
    if (searchQuery && searchQuery.trim() !== '') {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    const { data: creators, error } = await query;
    if (error) throw error;
    return creators || [];
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to mock UI...", err);
    return StorageService.get('kalakar_creators') || [];
  }
}
export async function renderNetworkBoard(departmentFilter = 'All', searchQuery = '') {
  if (!talentGrid) return;

  // Skeleton State
  talentGrid.innerHTML = Array(6).fill(`
    <div class="card talent-card transition-elegant" style="padding: 16px;">
      <div style="display:flex; gap:16px;">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex:1;">
          <div class="skeleton skeleton-meta"></div>
          <div class="skeleton skeleton-meta" style="width: 50%;"></div>
        </div>
      </div>
    </div>
  `).join('');

  // Let the Postgres database handle the filtering
  const allCreators = await fetchCreatorsFromDB(departmentFilter, searchQuery);

  // NOISE REDUCTION: Only verified users on the main network board.
  const verifiedCreators = allCreators.filter(c => c.verified === true || c.credits?.length > 0);

  talentGrid.innerHTML = '';

  if (verifiedCreators.length === 0) {
    talentGrid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No verified professionals found matching criteria.</div>';
    return;
  }

  // Render returned rows
  verifiedCreators.forEach(creator => {
    if (creator.id === 'c_me') return;

    const card = document.createElement('div');
    card.className = 'talent-card transition-elegant';

    let avatarHTML = '';
    if (creator.videoUrl && creator.videoUrl.startsWith('http')) {
      avatarHTML = `<img src="${creator.videoUrl}" alt="${creator.name}" class="talent-avatar">`;
    } else {
      const initials = creator.name.split(' ').map(n => n[0]).join('').substring(0, 2);
      avatarHTML = `<div class="talent-avatar-placeholder">${initials}</div>`;
    }

    card.innerHTML = `
      ${avatarHTML}
      <div class="talent-info">
        <h3>${creator.name} ${creator.verified ? '<span style="color:var(--brand-gold); font-size: 1rem;">✓</span>' : ''}</h3>
        <p>${creator.role} · ${creator.city || 'Mumbai'}</p>
      </div>
      <div class="talent-tags">
        <span class="talent-tag ${creator.vouchedBy !== 'System' ? 'vouched' : ''}">
           ${creator.vouchedBy !== 'System' ? `Vouched by ${creator.vouchedBy}` : 'Unvouched'}
        </span>
        <span class="talent-tag">${creator.union || 'Non-Union'}</span>
      </div>
      <button class="job-card__btn open-chat-btn" data-target="negotiation-workspace" style="margin-top: auto;">Hire / Connect</button>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.open-chat-btn')) {
        openTalentProfile(creator.id);
      }
    });

    talentGrid.appendChild(card);
  });

  // Re-bind modal triggers
  document.querySelectorAll('.open-chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const modal = document.getElementById(`${targetId}-modal`);
      if (modal) {
        document.querySelectorAll('.slide-modal.active').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
      }
    });
  });
}
export async function openTalentProfile(creatorId) {
  const allCreators = await fetchCreatorsFromDB();
  const creator = allCreators.find(c => c.id === creatorId);
  if (!creator) return;

  // DOM Elements
  const modal = document.getElementById('talent-profile-modal');
  const avatarContainer = document.getElementById('tp-avatar-container');
  const nameEl = document.getElementById('tp-name');
  const roleCityEl = document.getElementById('tp-role-city');
  const tagsContainer = document.getElementById('tp-tags');
  const creditsContainer = document.getElementById('tp-credits');
  const kitEl = document.getElementById('tp-kit');

  // Populate Avatar
  if (creator.videoUrl && creator.videoUrl.startsWith('http')) {
    avatarContainer.innerHTML = `<img src="${creator.videoUrl}" alt="${creator.name}" class="profile-avatar-large">`;
  } else {
    const initials = creator.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    avatarContainer.innerHTML = `<div class="profile-avatar-placeholder-large">${initials}</div>`;
  }

  // Populate Header Data
  nameEl.innerHTML = `${creator.name} ${creator.verified ? '<span class="verified-icon" title="Verified Professional" style="color:var(--brand-gold);">★</span>' : ''}`;
  roleCityEl.textContent = `${creator.role} · ${creator.city}`;

  // Populate Tags
  tagsContainer.innerHTML = '';
  if (creator.union) {
    tagsContainer.innerHTML += `<span class="talent-tag" style="background: rgba(255,215,0,0.1); color: var(--brand-gold);">${creator.union}</span>`;
  }
  if (creator.vouchedBy !== 'System') {
    tagsContainer.innerHTML += `<span class="talent-tag vouched">Vouched by ${creator.vouchedBy}</span>`;
  }
  if (creator.tags && creator.tags.length) {
    creator.tags.forEach(tag => {
      tagsContainer.innerHTML += `<span class="talent-tag">${tag}</span>`;
    });
  }

  // Populate Add-ons (Vouch button + msg layout)
  let actionRow = document.getElementById('tp-action-row');
  if(!actionRow) {
    actionRow = document.createElement('div');
    actionRow.id = 'tp-action-row';
    actionRow.style.display = 'flex';
    actionRow.style.gap = '12px';
    actionRow.style.justifyContent = 'center';
    actionRow.style.marginTop = '16px';
    actionRow.style.width = '100%';
    const parent = document.querySelector('.profile-header-large');
    parent.appendChild(actionRow);
  }

  actionRow.innerHTML = `
    <button class="primary action-gold open-chat-btn" data-target="negotiation-workspace" data-id="${creatorId}" style="padding: 10px 24px; border-radius: 8px; font-weight: 600; flex:1;">💬 Message</button>
    <button class="ghost vouch-talent-btn" data-name="${creator.name}" data-craft="${creator.role}" style="padding: 10px 24px; border-radius: 8px; font-weight: 600; flex:1; border: 1px solid var(--brand-gold); color: var(--brand-gold);">⭐ Vouch</button>
  `;

  actionRow.querySelector('.vouch-talent-btn').addEventListener('click', (e) => {
    import('./vouchModal.js').then(module => module.openVouchModal(e.target.dataset.name, e.target.dataset.craft));
  });
  
  actionRow.querySelector('.open-chat-btn').addEventListener('click', (e) => {
    openChat(e.target.dataset.id);
  });

  // Prompt 3: Populate Verified Credits (Timeline UI)
  creditsContainer.innerHTML = '';
  if (creator.credits && creator.credits.length > 0) {
    creator.credits.forEach((credit, index) => {
      creditsContainer.innerHTML += `
        <div class="credit-timeline-item" style="position: relative; padding-left: 24px; margin-bottom: 24px;">
          <!-- Node Line -->
          <div style="position: absolute; left: 6px; top: 8px; bottom: ${index === creator.credits.length - 1 ? 'auto' : '-24px'}; width: 2px; background: var(--line);"></div>
          <!-- Node Dot -->
          <div style="position: absolute; left: 0; top: 6px; width: 14px; height: 14px; border-radius: 50%; ${credit.status === 'Verified' ? 'background: var(--success); border: 2px solid var(--success);' : 'background: var(--bg-primary); border: 2px solid var(--muted);'}"></div>
          
          <div style="display: flex; gap: 16px; align-items: flex-start;">
            <div style="font-family: monospace; font-size: 0.9rem; color: var(--muted); padding-top: 2px;">${credit.year || '2025'}</div>
            <div style="flex:1;">
              <h4 style="margin: 0 0 4px 0; font-size: 1rem;">"${credit.title}"</h4>
              <p style="margin: 0 0 4px 0; font-size: 0.85rem; color: var(--text-secondary);">Role: ${credit.role}</p>
              ${credit.director ? `<p style="margin: 0 0 4px 0; font-size: 0.85rem; color: var(--text-secondary);">Director: ${credit.director}</p>` : ''}
              
              <div style="margin-top: 6px; font-size: 0.8rem;">
                ${credit.status === 'Verified' 
                  ? `<span style="color: var(--success);">✓ Verified by ${credit.verifiedBy || 'System'}</span>`
                  : `<span style="color: var(--muted);">○ Unverified — <a href="#" style="color: var(--brand-gold); text-decoration: underline;">Request verification</a></span>`
                }
              </div>
            </div>
          </div>
        </div>
      `;
    });
  } else {
    creditsContainer.innerHTML = `<div class="empty-state text-center" style="padding: 32px 0;">No verified credits listed yet.<br><br><button class="ghost small">Request References</button></div>`;
  }

  // Populate Kit/Equipment
  if (creator.kit && creator.kit !== 'None') {
    kitEl.textContent = creator.kit;
    kitEl.parentElement.style.display = 'block';
  } else {
    kitEl.parentElement.style.display = 'none';
  }

  // Open Modal
  document.querySelectorAll('.slide-modal.active').forEach(m => m.classList.remove('active'));
  modal.classList.add('active');
}
document.getElementById('search-trigger')?.addEventListener('click', () => {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.remove('hidden');
  setTimeout(() => document.getElementById('global-search-input')?.focus(), 50);
});

document.getElementById('close-search')?.addEventListener('click', () => {
  document.getElementById('search-overlay').classList.add('hidden');
});

// Phase 19: Advanced Search & Filtering Architecture
export function performSearch() {
  const query = document.getElementById('global-search-input').value.toLowerCase();
  const city = document.getElementById('filter-city').value;
  const dept = document.getElementById('filter-dept').value;
  const kit = document.getElementById('filter-kit').value;
  const union = document.getElementById('filter-union').value;

  const creators = StorageService.get('kalakar_creators') || [];
  const resultsContainer = document.getElementById('search-content-area');

  if (!query && !city && !dept && !kit && !union) {
    // Reset to default recent searches view if everything is empty
    resultsContainer.innerHTML = `
      <div class="search-section">
        <h4 class="meta">Recent Searches</h4>
        <ul class="recent-list">
          <li>Casting Directors in Nashik</li>
          <li>DOP with RED V-Raptor</li>
          <li>Makeup Artists for Period Drama</li>
        </ul>
      </div>
      <div class="search-section">
        <h4 class="meta">Trending Tags</h4>
        <div class="trending-tags">
          <span class="chip">#IndieFilm</span>
          <span class="chip">#MarathiCinema</span>
          <span class="chip">#UrgentCasting</span>
        </div>
      </div>
    `;
    return;
  }

  // Multi-parameter filter
  const filtered = creators.filter(c => {
    const matchQuery = !query || c.name.toLowerCase().includes(query) || (c.role && c.role.toLowerCase().includes(query));
    const matchCity = !city || c.city === city;
    const matchDept = !dept || c.dept === dept;
    const matchKit = !kit || c.kit === kit;
    const matchUnion = !union || c.union === union;

    return matchQuery && matchCity && matchDept && matchKit && matchUnion;
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state" style="margin-top: 40px;">
        <div style="font-size: 2rem; margin-bottom: 12px;">🔍</div>
        <p>No professionals match your exact filters.</p>
        <p class="meta" style="font-size: 0.85rem;">Try broadening your kit or city parameters.</p>
      </div>
    `;
    return;
  }

  // Render matching cards
  let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
  filtered.forEach(creator => {
    html += `
      <div class="video-slot" style="position: relative; overflow: hidden; border-radius: 12px; background: var(--surface-2);">
        <img src="${creator.videoUrl || 'https://via.placeholder.com/800x1000/111/444?text=No+Video'}" style="width: 100%; height: 320px; object-fit: cover; opacity: 0.7;">
        <div class="hire-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
          <div class="creator-name" style="font-weight: 600; font-size: 1.1rem; color: #fff;">
            ${creator.name} ${creator.verified ? '<span style="color:var(--brand-gold);">★</span>' : ''}
          </div>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; color: var(--muted);">${creator.role} · ${creator.city || 'Location Unknown'}</p>
          <div style="margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap;">
            ${creator.kit && creator.kit !== 'None' ? `<span class="craft-tag" style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${creator.kit}</span>` : ''}
            ${creator.union ? `<span class="craft-tag" style="background: rgba(255,215,0,0.1); color: var(--brand-gold); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${creator.union}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  resultsContainer.innerHTML = html;
}

// Attach listeners
document.getElementById('global-search-input')?.addEventListener('input', performSearch);
document.querySelectorAll('.filter-chip').forEach(select => {
  select.addEventListener('change', performSearch);
});
// --- PHASE 29: NETWORK FILTERING LOGIC ---
document.querySelectorAll('#network-view .filter-pill').forEach(pill => {
  pill.addEventListener('click', (e) => {
    // UI Update
    document.querySelectorAll('#network-view .filter-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');

    // Data Update
    const dept = e.target.getAttribute('data-dept');
    const searchVal = document.getElementById('talent-search-input')?.value || '';
    renderNetworkBoard(dept, searchVal);
  });
});

document.getElementById('talent-search-input')?.addEventListener('input', (e) => {
  const activeDept = document.querySelector('#network-view .filter-pill.active')?.getAttribute('data-dept') || 'All';
  renderNetworkBoard(activeDept, e.target.value);
});
