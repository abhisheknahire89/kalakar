import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openTalentProfile } from './network.js';

export function initSearch() {
  const searchInput = document.getElementById('global-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    renderSearchResults(query);
  });
}

function renderSearchResults(query) {
  const container = document.getElementById('search-content-area');
  if (!container || !query) return;

  const creators = StorageService.get('kalakar_creators') || [];
  const results = creators.filter(c => 
    c.name.toLowerCase().includes(query) || 
    c.role.toLowerCase().includes(query) ||
    (c.tags && c.tags.some(t => t.toLowerCase().includes(query)))
  );

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state text-center" style="padding: 40px;">
        <p>No results found for "${query}"</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h4 class="meta" style="margin-bottom: 16px;">Search Results (${results.length})</h4>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${results.map(r => `
        <div class="search-result-item panel" data-id="${r.id}" style="padding: 12px; display: flex; gap: 12px; align-items: center; border: 1px solid var(--line); cursor: pointer;">
          <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(r.name)}" style="width: 40px; height: 40px; border-radius: 50%;">
          <div>
            <div style="font-weight: 600;">${r.name}</div>
            <div style="font-size: 0.8rem; color: var(--muted);">${r.role} · ${r.city}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      openTalentProfile(item.dataset.id);
      document.getElementById('search-overlay').classList.add('hidden');
    });
  });
}
