import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService } from './core.js';
import { showToast } from './toast.js';

export function initVouchModal() {
  const existing = document.getElementById('vouch-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'vouch-modal';
  modal.className = 'modal-overlay hidden';
  modal.innerHTML = `
    <div class="modal-content panel profile-large" style="max-width: 440px; padding: 24px;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.3rem;">Vouch for <span id="vouch-target-name">...</span></h2>
        <button id="close-vouch-btn" class="ghost small" style="font-size: 1.5rem;">&times;</button>
      </header>

      <div style="background: var(--surface-2); border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid var(--line);">
        <p class="meta" style="font-size: 0.85rem; margin-bottom: 8px;">A Vouch is a professional endorsement of reliability and craft. It boosts their visibility in casting calls.</p>
        <div id="vouch-target-label" style="font-weight: 700; color: var(--brand-gold);">Actor · Mumbai</div>
      </div>

      <div style="margin-bottom: 20px;">
        <label class="meta mb-2 block">Choose a Professional Vouch Category</label>
        <div class="vouch-chip-group" style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button class="vouch-chip active" data-category="Reliability">Reliability</button>
          <button class="vouch-chip" data-category="Technical Mastery">Technical Mastery</button>
          <button class="vouch-chip" data-category="Creative Vision">Creative Vision</button>
          <button class="vouch-chip" data-category="On-Set Etiquette">On-Set Etiquette</button>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <label class="meta mb-2 block">Personal Note (Optional)</label>
        <textarea id="vouch-comment" placeholder="Why are you vouching for them?" style="width: 100%; height: 80px; background: transparent; border: 1px solid var(--line); border-radius: 8px; color: var(--text); padding: 12px; resize: none;"></textarea>
      </div>

      <button id="submit-vouch-btn" class="primary full-width" style="padding: 14px; font-weight: 700; background: var(--brand-gold); color: black;">Confirm Professional Vouch</button>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = document.getElementById('close-vouch-btn');
  const submitBtn = document.getElementById('submit-vouch-btn');
  const chips = document.querySelectorAll('.vouch-chip');
  let selectedCategory = 'Reliability';

  closeBtn.onclick = () => modal.classList.add('hidden');

  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCategory = chip.dataset.category;
    };
  });

  submitBtn.onclick = async () => {
    const targetId = modal.dataset.targetId;
    const profile = StorageService.get('kalakar_user_profile');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        // 1. Create Vouch Document
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.vouches,
            ID.unique(),
            {
                vouchId: profile.$id, // The one giving the vouch
                talentId: targetId,   // The one receiving the vouch
                category: selectedCategory,
                comment: document.getElementById('vouch-comment').value,
                createdAt: new Date().toISOString()
            }
        );

        // 2. Increment Vouch Count on Target Profile
        const targetDoc = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.creators,
            targetId
        );

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.creators,
            targetId,
            { 
              vouchCount: (targetDoc.vouchCount || 0) + 1,
              reliability: Math.min(100, (targetDoc.reliability || 80) + 2) // Boost reliability
            }
        );

        showToast('Endorsement verified!', 'success');
        modal.classList.add('hidden');

    } catch (error) {
        console.warn('Vouch error:', error);
        showToast('Vouch failed. Try again later.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Professional Vouch';
    }
  };
}

export function openVouchModal(name, craft, id) {
  initVouchModal(); // Ensures fresh modal
  const modal = document.getElementById('vouch-modal');
  document.getElementById('vouch-target-name').textContent = name;
  document.getElementById('vouch-target-label').textContent = `${craft}`;
  modal.dataset.targetId = id;
  modal.classList.remove('hidden');
}
