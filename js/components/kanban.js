import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from '../appwriteClient.js';
import { openChat } from './chat.js';

export function createKanbanBoard(containerEl, { jobId, columns, onStatusChange }) {
  const cols = columns || [
    { id: 'pending', title: 'Applied' },
    { id: 'reviewed', title: 'Reviewed' },
    { id: 'shortlisted', title: 'Shortlist' },
    { id: 'audition', title: 'Audition' },
    { id: 'selected', title: 'Selected ✅' },
    { id: 'rejected', title: 'Rejected ❌' }
  ];

  containerEl.innerHTML = `
    <div class="kanban-wrapper" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 24px; min-height: 500px; -webkit-overflow-scrolling: touch;">
      ${cols.map(col => `
        <div class="kanban-column panel" data-status="${col.id}" style="min-width: 300px; flex: 1; background: var(--bg-primary); border: 1px solid var(--line); border-radius: 16px; display: flex; flex-direction: column;">
          <div class="kanban-column-header" style="padding: 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--bg-primary); z-index: 2; border-radius: 16px 16px 0 0;">
            <h4 style="margin: 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">${col.title}</h4>
            <span class="column-count badge highlight" style="font-size: 0.75rem;">0</span>
          </div>
          <div class="kanban-drop-zone" style="padding: 16px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; min-height: 200px;">
            <!-- Cards go here -->
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const dropzones = containerEl.querySelectorAll('.kanban-drop-zone');
  
  dropzones.forEach(zone => {
    zone.ondragover = (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        zone.style.background = 'rgba(197, 160, 89, 0.05)';
        zone.appendChild(draggingCard);
      }
    };

    zone.ondragleave = () => zone.style.background = 'transparent';

    zone.ondrop = (e) => {
      e.preventDefault();
      zone.style.background = 'transparent';
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        const applicationId = draggingCard.dataset.id;
        const newStatus = zone.closest('.kanban-column').dataset.status;
        if (onStatusChange) onStatusChange(applicationId, newStatus);
        updateCounts();
      }
    };
  });

  function updateCounts() {
    containerEl.querySelectorAll('.kanban-column').forEach(col => {
      col.querySelector('.column-count').textContent = col.querySelectorAll('.kanban-card').length;
    });
  }

  const renderApplications = async (applications) => {
    dropzones.forEach(z => z.innerHTML = '<div class="skeleton" style="height:100px; width:100%;"></div>');

    for (const app of applications) {
      try {
        const talent = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.creators,
          app.talentId
        );

        const status = app.status || 'pending';
        const col = containerEl.querySelector(`.kanban-column[data-status="${status}"] .kanban-drop-zone`);
        if (!col) continue;

        if (col.querySelector('.skeleton')) col.innerHTML = '';

        const card = createCard(app, talent);
        col.appendChild(card);
      } catch (err) {
        console.warn('Kanban card error:', err);
      }
    }
    
    // Clear remaining skeletons
    dropzones.forEach(z => {
        if (z.querySelector('.skeleton')) z.innerHTML = '';
    });
    updateCounts();
  };

  function createCard(app, talent) {
    const card = document.createElement('div');
    card.className = 'kanban-card card panel';
    card.dataset.id = app.$id;
    card.draggable = true;
    card.style.cursor = 'grab';
    card.style.padding = '12px';
    card.style.border = '1px solid var(--line)';

    const avatar = talent.avatarFileId ? 
        storage.getFilePreview(BUCKETS.avatars, talent.avatarFileId, 80).href : 
        `https://i.pravatar.cc/80?u=${talent.$id}`;

    card.innerHTML = `
      <div style="display: flex; gap: 12px; align-items: start; margin-bottom: 8px;">
        <img src="${avatar}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
        <div style="flex: 1; overflow: hidden;">
          <div style="font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${talent.name} ${talent.isVerified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}
          </div>
          <div class="meta" style="font-size: 0.75rem;">${talent.primaryCraft} · ${talent.city}</div>
        </div>
      </div>
      <div class="meta" style="font-size: 0.8rem; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 12px;">
        ${app.coverNote || 'No cover note provided.'}
      </div>
      <div style="display: flex; gap: 8px; border-top: 1px solid var(--line); padding-top: 10px;">
        <button class="ghost small view-reel-btn" style="flex: 1; padding: 4px; font-size: 0.7rem;">▶ Reel</button>
        <button class="ghost small msg-talent-btn" style="flex: 1; padding: 4px; font-size: 0.7rem;" data-id="${talent.$id}">💬 Message</button>
      </div>
    `;

    card.ondragstart = () => { card.classList.add('dragging'); card.style.opacity = '0.5'; };
    card.ondragend = () => { card.classList.remove('dragging'); card.style.opacity = '1'; };

    card.querySelector('.msg-talent-btn').onclick = (e) => {
        e.stopPropagation();
        openChat(talent.$id);
    };

    return card;
  }

  return { renderApplications };
}
