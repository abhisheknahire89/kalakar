import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openChat } from './chat.js';

const recentJobsFeed = document.querySelector('#recent-jobs-feed');
const featuredJobsCarousel = document.querySelector('#featured-jobs-carousel-content');
const applicantsSection = document.querySelector('#applicants-section');
const applicantsList = document.querySelector('#applicants-list');
const postJobModal = document.querySelector('#post-job-modal');
const postJobForm = document.querySelector('#post-job-form');
const currentJobTitleSpan = document.querySelector('#current-job-title');

// Phase 32: Jobs Data Hooking
export async function fetchJobsFromDB() {
  try {
    const { data: jobs, error } = await window.supabaseClient.from('jobs').select('*');
    if (error) throw error;
    return jobs || [];
  } catch (err) {
    console.warn("Supabase fetch failed, falling back to mock UI...", err);
    return StorageService.get(StorageService.KEYS.JOBS) || [];
  }
}

export async function renderJobs(filter = 'all') {

  const allJobs = await fetchJobsFromDB();

  const filteredJobs = filter === 'all'
    ? allJobs
    : allJobs.filter(j => j.roleType && j.roleType.toLowerCase() === filter.toLowerCase());

  if (recentJobsFeed) recentJobsFeed.innerHTML = '';
  if (featuredJobsCarousel) featuredJobsCarousel.innerHTML = '';

  if (applicantsSection) applicantsSection.classList.add('hidden');

  const urgentJobs = filteredJobs.filter(j => j.urgent).sort((a, b) => b.createdAt - a.createdAt);
  const normalJobs = filteredJobs.filter(j => !j.urgent).sort((a, b) => b.createdAt - a.createdAt);

  urgentJobs.forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__prod">${job.company} ${job.verified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}</p>
        </div>
      </div>
      <div class="job-meta">
        <span class="job-meta__tag">${job.type}</span>
        <span class="job-meta__tag">${job.location}</span>
        <span class="job-meta__tag" style="color: var(--success); border-color: var(--success);">Urgent</span>
      </div>
      <button class="job-card__btn open-chat-btn" data-target="negotiation-workspace">💸 Initiate Deal</button>
    `;
    if (featuredJobsCarousel) featuredJobsCarousel.appendChild(card);
  });

  filteredJobs.sort((a, b) => b.createdAt - a.createdAt).forEach(job => {
    const card = document.createElement('div');
    card.className = 'job-card feed-item';
    card.innerHTML = `
      <div class="job-card__header">
        <div>
          <h3 class="job-card__title">${job.title}</h3>
          <p class="job-card__prod">${job.company} ${job.verified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}</p>
        </div>
        <div style="font-size: 0.75rem; color: var(--muted);">${Math.floor((Date.now() - job.createdAt) / 3600000)}h ago</div>
      </div>
      <div class="job-meta">
        <span class="job-meta__tag">${job.type}</span>
        <span class="job-meta__tag">${job.location}</span>
        ${job.tags.map(t => `<span class="job-meta__tag">${t}</span>`).join('')}
      </div>
      <button class="job-card__btn open-chat-btn" data-target="negotiation-workspace">💸 Initiate Deal</button>
    `;
    if (recentJobsFeed) recentJobsFeed.appendChild(card);
  });
}
export function viewApplicants(jobId) {
  const allJobs = StorageService.get(StorageService.KEYS.JOBS) || [];
  const job = allJobs.find(j => j.id === jobId);
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS) || [];
  const jobApps = apps.filter(a => a.jobId === jobId);

  currentJobTitleSpan.textContent = job.title;
  if (recentJobsFeed) recentJobsFeed.closest('.view').classList.add('hidden');
  applicantsSection.classList.remove('hidden');

  applicantsList.innerHTML = '';
  jobApps.forEach(app => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-row">
        <div>
          <h3>${app.name}</h3>
          <p>${app.role}</p>
        </div>
        <span class="badge ${app.status === 'shortlisted' ? 'shortlisted' : ''}">${app.status}</span>
      </div>
      <div class="card-row" style="margin-top: 10px;">
        <p class="meta">Applied ${new Date(app.createdAt).toLocaleDateString()}</p>
        <div class="actions">
          ${app.status !== 'shortlisted'
        ? `<button class="primary small shortlist-btn" data-id="${app.id}">Shortlist</button>`
        : `<button class="ghost small msg-btn" data-id="${app.id}">Message</button>`}
        </div>
      </div>
    `;
    applicantsList.appendChild(card);
  });

  document.querySelectorAll('.shortlist-btn').forEach(btn => {
    btn.addEventListener('click', () => shortlistApplicant(btn.dataset.id, jobId));
  });

  document.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => openChat(btn.dataset.id));
  });
}

export function shortlistApplicant(appId, jobId) {
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS);
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    apps[index].status = 'shortlisted';
    StorageService.set(StorageService.KEYS.APPLICATIONS, apps);
    viewApplicants(jobId);
  }
}
// Modal Logic
document.querySelector('#post-job-trigger')?.addEventListener('click', () => {
  postJobModal.classList.remove('hidden');
});

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    postJobModal.classList.add('hidden');
  });
});

postJobForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const newJob = {
    id: 'j' + Date.now(),
    title: document.querySelector('#job-title').value,
    type: document.querySelector('#job-type').value,
    location: document.querySelector('#job-location').value,
    desc: document.querySelector('#job-desc').value,
    posterId: StorageService.get(StorageService.KEYS.USER),
    createdAt: Date.now()
  };

  const jobs = StorageService.get(StorageService.KEYS.JOBS);
  jobs.push(newJob);
  StorageService.set(StorageService.KEYS.JOBS, jobs);

  postJobModal.classList.add('hidden');
  postJobForm.reset();
  renderJobs('my');
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderJobs(btn.dataset.tab);
  });
});

document.querySelector('.back-link')?.addEventListener('click', () => {
  renderJobs('all');
});
