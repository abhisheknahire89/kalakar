export function initVouchModal() {
  const modalHTML = `
    <div id="vouch-modal" class="modal-overlay hidden">
      <div class="modal-content panel profile-large" style="max-width: 480px; padding: 24px; text-align: left; background: var(--bg-primary);">
        <header class="modal-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 1.3rem; margin: 0;">⭐ Vouch for <span id="vouch-target-name">Talent</span></h2>
          <button class="close-btn" id="close-vouch-btn" style="background:none; border:none; font-size: 1.5rem; color: var(--text); cursor:pointer;">&times;</button>
        </header>

        <div style="margin-bottom: 20px;">
          <label style="display: block; font-size: 0.9rem; margin-bottom: 12px; color: var(--muted);">What skill are you vouching for?</label>
          <div id="vouch-skill-suggestions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;">
            <!-- Suggested skills injected dynamically -->
          </div>
          <input type="text" id="vouch-custom-skill" placeholder="Or type a custom skill..." style="width: 100%; padding: 10px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--line); color: var(--text);">
        </div>

        <div style="margin-bottom: 24px;">
          <label style="display: block; font-size: 0.9rem; margin-bottom: 8px; color: var(--muted);">Short testimonial (optional):</label>
          <textarea id="vouch-testimonial" placeholder="Max 280 characters" maxlength="280" style="width: 100%; height: 80px; padding: 10px; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--line); color: var(--text); resize: none;"></textarea>
          <div style="text-align: right; font-size: 0.75rem; color: var(--muted); margin-top: 4px;"><span id="vouch-char-count">0</span> / 280</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button class="ghost" id="cancel-vouch-btn" style="padding: 10px 20px; border-radius: 8px;">Cancel</button>
          <button class="primary action-gold" id="submit-vouch-btn" style="padding: 10px 20px; border-radius: 8px; font-weight: 600;">Submit ⭐</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modal = document.getElementById('vouch-modal');
  const cancelBtn = document.getElementById('cancel-vouch-btn');
  const closeBtn = document.getElementById('close-vouch-btn');
  const submitBtn = document.getElementById('submit-vouch-btn');
  const testimonial = document.getElementById('vouch-testimonial');
  const charCount = document.getElementById('vouch-char-count');
  const customSkill = document.getElementById('vouch-custom-skill');

  const closeModal = () => {
    modal.classList.add('hidden');
    customSkill.value = '';
    testimonial.value = '';
    charCount.textContent = '0';
    document.querySelectorAll('.vouch-skill-chip').forEach(c => c.classList.remove('selected'));
  };

  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  testimonial.addEventListener('input', () => {
    charCount.textContent = testimonial.value.length;
  });

  submitBtn.addEventListener('click', () => {
    const selectedChip = document.querySelector('.vouch-skill-chip.selected');
    const skill = selectedChip ? selectedChip.textContent : customSkill.value.trim();

    if (!skill) {
      alert('Please select or enter a skill.');
      return;
    }

    if (window.showToast) {
      window.showToast(`You vouched for ${document.getElementById('vouch-target-name').textContent}'s ${skill}!`, 'success');
    } else {
      alert(`You vouched for ${document.getElementById('vouch-target-name').textContent}'s ${skill}!`);
    }

    closeModal();
  });
}

export function openVouchModal(voucheeName, craft) {
  const modal = document.getElementById('vouch-modal');
  document.getElementById('vouch-target-name').textContent = voucheeName;

  // Render suggestions based on craft Context
  const skillsMap = {
    'Actor': ['Method Acting', 'Improvisation', 'Dialogue Delivery', 'Dance', 'Emotional Range'],
    'Cinematographer': ['Steadicam', 'Handheld', 'Lighting', 'Color Science'],
    'Director': ['Actor Direction', 'Visual Storytelling', 'Shot Planning'],
    'Editor': ['Narrative Pacing', 'Color Grading', 'VFX Integration']
  };

  const suggestions = skillsMap[craft] || ['Professionalism', 'Punctuality', 'Teamwork'];
  const container = document.getElementById('vouch-skill-suggestions');
  
  container.innerHTML = suggestions.map(skill => 
    `<button class="ghost small vouch-skill-chip" style="border-radius: 20px; padding: 6px 14px; border: 1px solid var(--line);">${skill}</button>`
  ).join('');

  container.querySelectorAll('.vouch-skill-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.vouch-skill-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      chip.style.borderColor = 'var(--brand-gold)';
      chip.style.color = 'var(--brand-gold)';
    });
  });

  modal.classList.remove('hidden');
}

// Ensure init
document.addEventListener('DOMContentLoaded', initVouchModal);
