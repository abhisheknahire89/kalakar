import {
  listJobs,
  createJob,
  applyToJob,
  getCurrentUserSafe
} from '../services/jobsService.js';

const jobForm = document.getElementById('job-form');
const postJobBtn = document.getElementById('post-job-btn');
const refreshBtn = document.getElementById('refresh-btn');
const listLoading = document.getElementById('list-loading');
const listError = document.getElementById('list-error');
const emptyState = document.getElementById('empty-state');
const jobsList = document.getElementById('jobs-list');
const loadMoreBtn = document.getElementById('load-more-btn');

let nextCursor = null;
let hasMore = true;
let currentUserId = null;

function resetListStates() {
  listError.textContent = '';
  listError.classList.add('hidden');
  emptyState.classList.add('hidden');
}

function showError(message) {
  listError.textContent = message;
  listError.classList.remove('hidden');
}

function setLoading(loading) {
  listLoading.classList.toggle('hidden', !loading);
}

function clearJobs() {
  jobsList.innerHTML = '';
}

function setButtonLoading(button, loading, loadingText, idleText) {
  button.disabled = loading;
  button.textContent = loading ? loadingText : idleText;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createJobCard(job) {
  const card = document.createElement('article');
  card.className = 'job-card';

  const canApply = Boolean(currentUserId) && currentUserId !== job.createdBy;

  card.innerHTML = `
    <h3>${escapeHtml(job.title || 'Untitled Role')}</h3>
    <p class="meta">${escapeHtml(job.city || 'Unknown city')} • ${escapeHtml(job.roleType || 'Role')} • ${escapeHtml(job.experienceLevel || 'Any')}</p>
    <p>${escapeHtml(job.description || '')}</p>
    <p class="meta">Posted on ${new Date(job.createdAt || job.$createdAt).toLocaleDateString()}</p>
    <div class="apply-row">
      <textarea class="apply-note" placeholder="Optional note for recruiter"></textarea>
      <button class="apply-btn" type="button" ${canApply ? '' : 'disabled'}>
        ${canApply ? 'Apply Now' : 'Login as talent to apply'}
      </button>
      <p class="apply-state state hidden"></p>
    </div>
  `;

  const applyBtn = card.querySelector('.apply-btn');
  const applyNote = card.querySelector('.apply-note');
  const applyState = card.querySelector('.apply-state');

  applyBtn.addEventListener('click', async () => {
    applyState.className = 'apply-state state hidden';
    setButtonLoading(applyBtn, true, 'Applying...', 'Apply Now');

    const result = await applyToJob(job.$id, applyNote.value);

    setButtonLoading(applyBtn, false, 'Applying...', 'Apply Now');

    if (!result.success) {
      applyState.textContent = result.error;
      applyState.className = 'apply-state state error';
      return;
    }

    applyState.textContent = 'Application submitted successfully.';
    applyState.className = 'apply-state state success';
    applyBtn.disabled = true;
    applyBtn.textContent = 'Applied';
  });

  return card;
}

async function loadCurrentUser() {
  const result = await getCurrentUserSafe();
  if (result.success) {
    currentUserId = result.data.$id;
  } else {
    currentUserId = null;
  }
}

async function renderJobs({ append = false } = {}) {
  if (!append) {
    nextCursor = null;
    hasMore = true;
  }

  setLoading(true);
  resetListStates();

  const result = await listJobs({ limit: 8, cursor: append ? nextCursor : null });

  setLoading(false);

  if (!result.success) {
    showError(result.error || 'Failed to load jobs.');
    return;
  }

  if (!append) {
    clearJobs();
  }

  const jobs = result.data.jobs;
  nextCursor = result.data.nextCursor;
  hasMore = Boolean(nextCursor) && jobs.length > 0;

  if (!append && jobs.length === 0) {
    emptyState.classList.remove('hidden');
  }

  jobs.forEach((job) => jobsList.appendChild(createJobCard(job)));

  loadMoreBtn.classList.toggle('hidden', !hasMore);
}

jobForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(jobForm);
  const payload = {
    title: formData.get('title'),
    description: formData.get('description'),
    city: formData.get('city'),
    roleType: formData.get('roleType'),
    experienceLevel: formData.get('experienceLevel')
  };

  setButtonLoading(postJobBtn, true, 'Posting...', 'Post Job');

  const result = await createJob(payload);

  setButtonLoading(postJobBtn, false, 'Posting...', 'Post Job');

  if (!result.success) {
    showError(result.error || 'Failed to post job.');
    return;
  }

  jobForm.reset();
  await renderJobs();
});

refreshBtn.addEventListener('click', async () => {
  await renderJobs();
});

loadMoreBtn.addEventListener('click', async () => {
  if (!hasMore) return;
  await renderJobs({ append: true });
});

(async function init() {
  await loadCurrentUser();
  await renderJobs();
})();
