import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openChat } from './chat.js';
import { createKanbanBoard } from './kanban.js';

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
      <div style="display:flex; justify-content:space-between; margin-top: 12px; align-items:center;">
        <button class="ghost small view-applicants-btn" data-id="${job.id}" style="padding: 4px 12px; border-radius: 20px;">Applicants</button>
        <button class="job-card__btn open-chat-btn" data-target="negotiation-workspace" style="margin-top:0;">💸 Deal</button>
      </div>
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
      <div style="display:flex; justify-content:space-between; margin-top: 12px; align-items:center;">
        <button class="ghost small view-applicants-btn" data-id="${job.id}" style="padding: 4px 12px; border-radius: 20px;">View Applicants</button>
        <button class="job-card__btn open-chat-btn" data-target="negotiation-workspace" style="margin-top:0;">💸 Initiate Deal</button>
      </div>
    `;
    if (recentJobsFeed) recentJobsFeed.appendChild(card);
  });

  document.querySelectorAll('.view-applicants-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewApplicants(e.target.dataset.id);
    });
  });
}

export function viewApplicants(jobId) {
  const allJobs = StorageService.get(StorageService.KEYS.JOBS) || [];
  const job = allJobs.find(j => j.id === jobId);
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS) || [];
  const jobApps = apps.filter(a => a.jobId === jobId);

  currentJobTitleSpan.textContent = job.title;
  document.querySelector('.view-header').classList.add('hidden'); // hide main jobs header
  recentJobsFeed.closest('#jobs-view').querySelector('h3').classList.add('hidden');
  recentJobsFeed.closest('#jobs-view').querySelectorAll('h3')[1].classList.add('hidden');
  recentJobsFeed.classList.add('hidden');
  featuredJobsCarousel.classList.add('hidden');
  
  applicantsSection.classList.remove('hidden');
  
  // Prompt 2: Kanban Board injection
  const { renderApplications } = createKanbanBoard(applicantsList, {
    jobId: jobId,
    onStatusChange: (applicationId, newStatus) => {
      const apps = StorageService.get(StorageService.KEYS.APPLICATIONS);
      const index = apps.findIndex(a => a.id === applicationId);
      if (index !== -1) {
        apps[index].status = newStatus;
        StorageService.set(StorageService.KEYS.APPLICATIONS, apps);
        
        // Notification logic (Prompt 6 framework)
        showToast(`Application moved to ${newStatus.toUpperCase()}`, 'success');
      }
    }
  });

  renderApplications(jobApps);
}

function showToast(msg, type) {
    if(window.showToast) window.showToast(msg, type); // Global fallback
    else alert(msg);
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
