import { StorageServiceInstance as StorageService } from './core.js';
import { openChat } from './chat.js';

export function createKanbanBoard(containerEl, { jobId, columns, onStatusChange }) {
  // Define columns if not provided
  const cols = columns || [
    { id: 'pending', title: 'Applied' },
    { id: 'reviewed', title: 'Reviewed' },
    { id: 'shortlisted', title: 'Shortlist' },
    { id: 'audition', title: 'Audition' },
    { id: 'selected', title: 'Selected ✅' },
    { id: 'rejected', title: 'Rejected ❌' }
  ];

  // Base structure
  containerEl.innerHTML = `
    <div class="kanban-wrapper" style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px; min-height: 400px; -webkit-overflow-scrolling: touch; scroll-snap-type: x mandatory;">
      ${cols.map(col => `
        <div class="kanban-column panel" data-status="${col.id}" style="min-width: 280px; flex: 1; background: var(--bg-elevated); border: 1px solid var(--line); border-radius: var(--radius-md); display: flex; flex-direction: column; scroll-snap-align: start;">
          <div class="kanban-column-header" style="padding: 12px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: var(--bg-elevated); z-index: 2; border-radius: var(--radius-md) var(--radius-md) 0 0;">
            <h4 style="margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted);">${col.title}</h4>
            <span class="column-count badge highlight" style="font-size: 0.75rem;">0</span>
          </div>
          <div class="kanban-drop-zone" style="padding: 12px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; transition: background 0.2s, border 0.2s;">
            <!-- Cards go here -->
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const dropzones = containerEl.querySelectorAll('.kanban-drop-zone');
  
  // Setup drag and drop events for dropzones
  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        zone.style.background = 'rgba(212, 168, 67, 0.05)';
        zone.style.borderColor = 'var(--brand-gold)';
        const afterElement = getDragAfterElement(zone, e.clientY);
        if (afterElement == null) {
          zone.appendChild(draggingCard);
        } else {
          zone.insertBefore(draggingCard, afterElement);
        }
      }
    });

    zone.addEventListener('dragleave', () => {
      zone.style.background = 'transparent';
      zone.style.borderColor = 'transparent';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.background = 'transparent';
      zone.style.borderColor = 'transparent';
      
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        const applicationId = draggingCard.dataset.id;
        const newStatus = zone.closest('.kanban-column').dataset.status;
        
        // Update data
        if (onStatusChange) {
          onStatusChange(applicationId, newStatus);
        }
        
        updateCounts();
      }
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateCounts() {
    containerEl.querySelectorAll('.kanban-column').forEach(col => {
      const count = col.querySelectorAll('.kanban-card').length;
      col.querySelector('.column-count').textContent = count;
    });
  }

  // Populate data
  const renderApplications = (applications) => {
    // Clear all zones
    dropzones.forEach(z => z.innerHTML = '');

    applications.forEach(app => {
      let status = app.status || 'pending';
      const col = containerEl.querySelector(`.kanban-column[data-status="${status}"] .kanban-drop-zone`);
      
      if (!col) return; // safeguard

      const creatorData = StorageService.get('kalakar_creators')?.find(c => c.name === app.name) || { name: app.name, role: app.role, city: 'Mumbai', verified: false, reliability: 85 };

      const card = document.createElement('div');
      card.className = 'kanban-card card';
      card.dataset.id = app.id;
      card.draggable = true;
      card.style.cursor = 'grab';
      card.style.padding = '12px';
      card.style.position = 'relative';

      // Status visual accent
      if (status === 'selected') card.style.borderLeft = '4px solid var(--success)';
      if (status === 'rejected') { 
        card.style.borderLeft = '4px solid var(--danger)';
        card.style.opacity = '0.7';
      }

      card.innerHTML = `
        <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px;">
          <img src="https://i.pravatar.cc/150?u=${encodeURIComponent(creatorData.name)}" style="width: 40px; height: 40px; border-radius: 50%;">
          <div style="flex: 1; overflow: hidden;">
            <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${creatorData.name} ${creatorData.verified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}
            </div>
            <div style="font-size: 0.8rem; color: var(--muted);">${creatorData.role}</div>
            <div style="font-size: 0.75rem; margin-top: 4px; color: var(--brand-gold);">⭐ ${creatorData.reliability}% Reliability</div>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${app.coverNote || 'No cover note provided.'}
        </div>
        <div style="display: flex; gap: 8px; border-top: 1px solid var(--line); padding-top: 8px;">
          <button class="ghost small view-reel-btn" style="flex: 1; padding: 4px; font-size: 0.75rem;">▶ Reel</button>
          <button class="ghost small msg-applicant-btn" style="flex: 1; padding: 4px; font-size: 0.75rem;" data-id="${app.id}">💬 Msg</button>
        </div>
      `;

      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        card.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        // HTML5 drag required data
        e.dataTransfer.setData('text/plain', app.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        if (card.dataset.status !== 'rejected') card.style.opacity = '1';
      });

      card.querySelector('.msg-applicant-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openChat(app.id); // Or ideally creator's ID
      });

      col.appendChild(card);
    });

    updateCounts();
  };

  return { renderApplications };
}
