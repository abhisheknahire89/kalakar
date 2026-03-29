import { StorageServiceInstance as StorageService } from './core.js';

export function initContractBuilder(onComplete) {
  const modalHTML = `
    <div id="contract-modal" class="modal-overlay hidden">
      <div class="modal-content panel profile-large" style="max-width: 500px; padding: 24px; text-align: left; background: var(--bg-primary);">
        <header class="modal-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.3rem; margin: 0;">📜 Build Smart Deal Memo</h2>
          <button class="close-btn" id="close-contract-btn" style="background:none; border:none; font-size: 1.5rem; color: var(--text); cursor:pointer;">&times;</button>
        </header>

        <div style="margin-bottom: 20px;">
          <label class="meta" style="display: block; margin-bottom: 8px;">Project Title</label>
          <input type="text" id="deal-project-title" placeholder="e.g. City of Dust - Feature Film" style="margin-bottom: 16px;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <label class="meta" style="display: block; margin-bottom: 8px;">Total Fee (INR)</label>
              <input type="number" id="deal-total-fee" placeholder="50000" style="margin-bottom: 16px;">
            </div>
            <div>
              <label class="meta" style="display: block; margin-bottom: 8px;">Duration (Days)</label>
              <input type="number" id="deal-duration" placeholder="10" style="margin-bottom: 16px;">
            </div>
          </div>

          <label class="meta" style="display: block; margin-bottom: 8px;">Milestone Breakdown</label>
          <div id="milestones-container" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
            <div class="milestone-entry" style="display: flex; gap: 8px;">
              <input type="text" placeholder="e.g. Booking Advance" style="flex: 2; margin-bottom: 0;">
              <input type="number" placeholder="%" style="flex: 1; margin-bottom: 0;">
            </div>
          </div>
          <button class="ghost small" id="add-milestone-btn" style="width: 100%; margin-bottom: 16px;">+ Add Milestone</button>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button class="ghost" id="cancel-contract-btn" style="padding: 10px 20px; border-radius: 8px;">Discard</button>
          <button class="primary action-gold" id="send-deal-btn" style="padding: 10px 20px; border-radius: 8px; font-weight: 600;">Inject into Chat</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('contract-modal');
  const closeBtn = document.getElementById('close-contract-btn');
  const cancelBtn = document.getElementById('cancel-contract-btn');
  const sendBtn = document.getElementById('send-deal-btn');
  const addMilestoneBtn = document.getElementById('add-milestone-btn');
  const milestonesContainer = document.getElementById('milestones-container');

  addMilestoneBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'milestone-entry';
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.innerHTML = `
      <input type="text" placeholder="Milestone description" style="flex: 2; margin-bottom: 0;">
      <input type="number" placeholder="%" style="flex: 1; margin-bottom: 0;">
    `;
    milestonesContainer.appendChild(div);
  });

  const closeModal = () => {
    modal.classList.add('hidden');
    // reset fields
    document.getElementById('deal-project-title').value = '';
    document.getElementById('deal-total-fee').value = '';
    document.getElementById('deal-duration').value = '';
    milestonesContainer.innerHTML = `
      <div class="milestone-entry" style="display: flex; gap: 8px;">
        <input type="text" placeholder="e.g. Booking Advance" style="flex: 2; margin-bottom: 0;">
        <input type="number" placeholder="%" style="flex: 1; margin-bottom: 0;">
      </div>
    `;
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  sendBtn.addEventListener('click', () => {
    const projectTitle = document.getElementById('deal-project-title').value;
    const totalFee = document.getElementById('deal-total-fee').value;
    const duration = document.getElementById('deal-duration').value;

    if (!projectTitle || !totalFee) {
      alert("Please fill in project title and total fee.");
      return;
    }

    const milestones = Array.from(milestonesContainer.querySelectorAll('.milestone-entry')).map(entry => ({
      description: entry.querySelectorAll('input')[0].value,
      percentage: entry.querySelectorAll('input')[1].value,
    })).filter(m => m.description && m.percentage);

    const dealData = {
      type: 'deal-memo',
      id: 'deal_' + Date.now(),
      project: projectTitle,
      totalFee: totalFee,
      currency: 'INR',
      duration: duration,
      milestones: milestones,
      status: 'pending'
    };

    if (onComplete) onComplete(dealData);
    closeModal();
  });
}

export function openContractBuilder() {
  const modal = document.getElementById('contract-modal');
  if (modal) modal.classList.remove('hidden');
}

export function renderDealMemoCard(deal) {
  return `
    <div class="contract-card">
      <div class="contract-header">
        <span class="contract-title">DEAL MEMO</span>
        <span class="contract-status-tag">${deal.status.toUpperCase()}</span>
      </div>
      <div class="contract-body">
        <div class="contract-detail-row">
          <span>Project</span>
          <span style="color:white; font-weight:600;">${deal.project}</span>
        </div>
        <div class="contract-detail-row">
          <span>Value</span>
          <span style="color:white; font-weight:600;">${deal.currency} ${deal.totalFee}</span>
        </div>
        <div class="contract-detail-row">
          <span>Schedule</span>
          <span style="color:white; font-weight:600;">${deal.duration} Days</span>
        </div>
        
        <div class="milestone-tracker">
          ${deal.milestones.map(m => `
            <div class="milestone-item">
              <div class="milestone-dot"></div>
              <span>${m.description} (${m.percentage}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="contract-actions">
        ${deal.status === 'pending' ? `
          <button class="primary action-gold accept-deal-btn" data-id="${deal.id}" style="flex:1; padding: 8px; font-size: 0.8rem;">Accept & Sign</button>
          <button class="ghost decline-deal-btn" data-id="${deal.id}" style="flex:1; padding: 8px; font-size: 0.8rem;">Negotiate</button>
        ` : `
          <div style="width: 100%; text-align: center; color: var(--success); font-weight: 700; padding: 8px; border: 1px dashed var(--success); border-radius: 8px;">
            SIGNED & SECURED
          </div>
        `}
      </div>
    </div>
  `;
}
