import { listExploreCreators } from '../services/appData.js';
import { openHireFlow, openChat } from './chat.js';
import { renderProfile } from './profile.js';

let exploreBound = false;

function escapeHtml(input) {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getTemplateCards() {
  return [
    { title: 'Casting shout', copy: 'Announce roles, mood, location, and dates in a clean prompt.' },
    { title: 'Collab finder', copy: 'Invite editors, DOPs, and actors into a concept before shoot day.' },
    { title: 'Portfolio push', copy: 'Package your latest clip with a caption that gets saved and shared.' }
  ];
}

function bindExploreEvents() {
  if (exploreBound) return;
  exploreBound = true;

  document.getElementById('network-view')?.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-explore-action]');
    if (!target) return;

    const profileId = target.dataset.profileId;
    const action = target.dataset.exploreAction;

    if (action === 'hire') {
      await openHireFlow(profileId);
      return;
    }

    if (action === 'message') {
      await openChat(profileId, 'message');
      return;
    }

    if (action === 'profile') {
      await renderProfile(profileId);
      window.location.hash = '#profile';
    }
  });

  document.getElementById('network-view')?.addEventListener('input', async (event) => {
    if (event.target.id !== 'explore-search-input') return;
    await renderNetworkBoard(event.target.value);
  });
}

export async function renderNetworkBoard(search = '') {
  bindExploreEvents();

  const container = document.getElementById('network-view');
  if (!container) return;

  const creators = await listExploreCreators(search);
  const templates = getTemplateCards();

  container.innerHTML = `
    <section class="beta-explore-shell">
      <div class="beta-feed-toolbar">
        <div>
          <p class="beta-kicker">Explore</p>
          <h2>Discover creators and launch-ready templates</h2>
        </div>
      </div>

      <label class="beta-search">
        <span>Search creators</span>
        <input id="explore-search-input" type="search" placeholder="Actor, DOP, director, Mumbai..." value="${escapeHtml(search)}" />
      </label>

      <div class="beta-template-row">
        ${templates.map((template) => `
          <article class="beta-template-card panel">
            <h3>${template.title}</h3>
            <p class="meta">${template.copy}</p>
          </article>
        `).join('')}
      </div>

      <div class="beta-creator-grid">
        ${creators.length ? creators.map((creator) => `
          <article class="beta-creator-card panel">
            <button class="beta-creator-head" data-explore-action="profile" data-profile-id="${creator.$id}">
              <img class="beta-avatar beta-avatar-lg" src="${creator.avatarUrl}" alt="${escapeHtml(creator.name)}" />
              <div>
                <strong>${escapeHtml(creator.name)}</strong>
                <p class="meta">${escapeHtml(creator.primaryCraft || creator.role || 'Creator')} · ${escapeHtml(creator.city || 'India')}</p>
              </div>
            </button>
            <p class="beta-card-copy">${escapeHtml(creator.bio || 'Portfolio coming alive soon.')}</p>
            <div class="beta-chip-row">
              <span class="beta-chip">${creator.isVerified ? 'Verified' : 'Open to work'}</span>
              <span class="beta-chip">${creator.vouchCount || 0} vouches</span>
            </div>
            <div class="beta-card-actions">
              <button class="ghost" data-explore-action="message" data-profile-id="${creator.$id}">Message</button>
              <button class="primary action-gold" data-explore-action="hire" data-profile-id="${creator.$id}">Hire</button>
            </div>
          </article>
        `).join('') : `
          <div class="beta-empty panel">
            <h3>No creators match that search yet</h3>
            <p class="meta">Try another city, role, or craft keyword.</p>
          </div>
        `}
      </div>
    </section>
  `;
}
