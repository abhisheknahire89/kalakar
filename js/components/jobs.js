import { databases, Query, ID, DATABASE_ID, COLLECTIONS } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService } from './core.js';
import { createKanbanBoard } from './kanban.js';
import { showToast } from './toast.js';
import { mockJobs, formatRelativeTime, mockCurrentProfile } from '../mockData.js';

const recentJobsFeed = document.querySelector('#recent-jobs-feed');
const featuredJobsCarousel = document.querySelector('#featured-jobs-carousel-content');
const applicantsSection = document.querySelector('#applicants-section');
const applicantsList = document.querySelector('#applicants-list');
const postJobModal = document.querySelector('#post-job-modal');
const postJobForm = document.querySelector('#post-job-form');
const currentJobTitleSpan = document.querySelector('#current-job-title');
const JOBS_COLLECTION = COLLECTIONS.JOBS || COLLECTIONS.jobs;
const APPLICATIONS_COLLECTION = COLLECTIONS.APPLICATIONS || COLLECTIONS.applications;

export async function renderJobs(filter = 'all') {
  const userProfile = StorageService.get('kalakar_user_profile') || mockCurrentProfile;
  if (!userProfile) {
    if (recentJobsFeed) recentJobsFeed.innerHTML = '<p class="text-center meta mt-4">Complete onboarding to access jobs.</p>';
    return;
  }

  if (recentJobsFeed) recentJobsFeed.innerHTML = '<div class="skeleton-container"></div>';
  if (featuredJobsCarousel) featuredJobsCarousel.innerHTML = '';
  if (applicantsSection) applicantsSection.classList.add('hidden');

  try {
    const queries = [Query.limit(20), Query.orderDesc('createdAt')];

    // Filter Logic
    if (filter === 'Acting' || filter === 'Crew') {
        queries.push(Query.equal('roleType', filter));
    } else if (filter === 'my') {
        queries.push(Query.equal('posterId', userProfile.$id));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      JOBS_COLLECTION,
      queries
    );

    const allJobs = response.documents;

    if (recentJobsFeed) recentJobsFeed.innerHTML = '';

    if (allJobs.length === 0) {
        renderMockJobs(filter);
        return;
    }

    // Featured (Urgent) Jobs
    allJobs.filter(j => j.isUrgent).forEach(job => {
      const card = createJobCard(job, true);
      if (featuredJobsCarousel) featuredJobsCarousel.appendChild(card);
    });

    // Main Feed
    allJobs.forEach(job => {
      const card = createJobCard(job, false);
      if (recentJobsFeed) recentJobsFeed.appendChild(card);
    });

    // Events
    document.querySelectorAll('.view-applicants-btn').forEach(btn => {
      btn.onclick = () => viewApplicants(btn.dataset.id);
    });

    document.querySelectorAll('.apply-job-btn').forEach(btn => {
      btn.onclick = () => handleApply(btn.dataset.id);
    });

  } catch (error) {
    console.warn('Jobs fallback to mock data.');
    renderMockJobs(filter);
  }
}

function createJobCard(job, isFeatured) {
  const card = document.createElement('div');
  card.className = isFeatured ? 'job-card' : 'job-card feed-item';
  
  const displayTime = formatRelativeTime(job.createdAt || new Date().toISOString());

  card.innerHTML = `
    <div class="job-card__header">
      <div>
        <h3 class="job-card__title">${job.title}</h3>
        <p class="job-card__prod">${job.company} ${job.isVerified ? '<span style="color:var(--brand-gold);">✓</span>' : ''}</p>
      </div>
      ${!isFeatured ? `<div style="font-size: 0.75rem; color: var(--muted);">${displayTime}</div>` : ''}
    </div>
    <div class="job-meta">
      <span class="job-meta__tag">${job.type}</span>
      <span class="job-meta__tag">${job.location}</span>
      ${job.isUrgent ? '<span class="job-meta__tag" style="color:var(--brand-gold); border-color:var(--brand-gold);">Urgent</span>' : ''}
    </div>
    ${job.timeline ? `<p class="meta" style="margin-top:8px;">${job.timeline}</p>` : ''}
    <div style="display:flex; justify-content:space-between; margin-top: 16px; align-items:center;">
      <button class="ghost small view-applicants-btn" data-id="${job.$id}">Applicants</button>
      <button class="job-card__btn apply-job-btn" data-id="${job.$id}" style="margin:0; padding: 6px 16px;">Easy Apply</button>
    </div>
  `;
  return card;
}

export async function viewApplicants(jobId) {
  try {
    const job = await databases.getDocument(
      DATABASE_ID,
      JOBS_COLLECTION,
      jobId
    );

    const response = await databases.listDocuments(
        DATABASE_ID,
        APPLICATIONS_COLLECTION,
        [Query.equal('jobId', jobId)]
    );

    currentJobTitleSpan.textContent = job.title;
    
    // UI Toggles
    recentJobsFeed.closest('#jobs-view').querySelectorAll('.view-header, h3, #featured-jobs-carousel-content, #recent-jobs-feed').forEach(el => {
        el.classList.add('hidden');
    });
    applicantsSection.classList.remove('hidden');
    
    const { renderApplications } = createKanbanBoard(applicantsList, {
      jobId: jobId,
      onStatusChange: async (applicationId, newStatus) => {
        try {
            await databases.updateDocument(
                DATABASE_ID,
                APPLICATIONS_COLLECTION,
                applicationId,
                { status: newStatus }
            );
            showToast(`Status updated to ${newStatus}`, 'success');
        } catch (error) {
            showToast('Failed to update status', 'danger');
        }
      }
    });

    renderApplications(response.documents);

  } catch (error) {
    console.warn('Applicants fallback unavailable.');
    showToast('Failed to load applicants', 'danger');
  }
}

async function handleApply(jobId) {
    const profile = StorageService.get('kalakar_user_profile');
    if (!profile) {
        showToast('Complete onboarding before applying.', 'info');
        return;
    }
    try {
        await databases.createDocument(
            DATABASE_ID,
            APPLICATIONS_COLLECTION,
            ID.unique(),
            {
                jobId: jobId,
                talentId: profile.$id,
                status: 'pending',
                appliedAt: new Date().toISOString()
            }
        );
        showToast('Application submitted!', 'success');
    } catch (error) {
        showToast('Already applied or error', 'info');
    }
}

// Modal Logic
document.querySelector('#post-job-trigger')?.addEventListener('click', () => {
    postJobModal.classList.remove('hidden');
});

postJobForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const profile = StorageService.get('kalakar_user_profile');
    
    try {
        await databases.createDocument(
            DATABASE_ID,
            JOBS_COLLECTION,
            ID.unique(),
            {
                title: document.querySelector('#job-title').value,
                company: profile.name, // or a company field
                type: document.querySelector('#job-type').value,
                location: document.querySelector('#job-location').value,
                description: document.querySelector('#job-desc').value,
                posterId: profile.$id,
                isUrgent: false,
                isVerified: true,
                createdAt: new Date().toISOString()
            }
        );

        postJobModal.classList.add('hidden');
        postJobForm.reset();
        showToast('Hiring call live!', 'success');
        renderJobs('my');
    } catch (error) {
        showToast('Failed to post job', 'danger');
    }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderJobs(btn.dataset.tab);
  };
});

document.querySelector('.back-link')?.addEventListener('click', () => {
    recentJobsFeed.closest('#jobs-view').querySelectorAll('.view-header, h3, #featured-jobs-carousel-content, #recent-jobs-feed').forEach(el => {
        el.classList.remove('hidden');
    });
    applicantsSection.classList.add('hidden');
    renderJobs('all');
});

function renderMockJobs(filter = 'all') {
    if (recentJobsFeed) recentJobsFeed.innerHTML = '';
    if (featuredJobsCarousel) featuredJobsCarousel.innerHTML = '';
    if (applicantsSection) applicantsSection.classList.add('hidden');

    const jobs = mockJobs.filter((job) => {
        if (filter === 'Acting' || filter === 'Crew') return job.roleType === filter;
        return true;
    });

    if (jobs.length === 0) {
        if (recentJobsFeed) recentJobsFeed.innerHTML = '<p class="text-center meta mt-4">No hiring calls found at the moment.</p>';
        return;
    }

    jobs.slice(0, 8).forEach((job) => {
        if (job.isUrgent && featuredJobsCarousel) {
            featuredJobsCarousel.appendChild(createJobCard(job, true));
        }
        if (recentJobsFeed) {
            recentJobsFeed.appendChild(createJobCard(job, false));
        }
    });
}
