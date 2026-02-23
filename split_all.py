import sys
import os

with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/app.js', 'r') as f:
    lines = f.readlines()

def get(start, end): return "".join(lines[start-1:end])

os.makedirs('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components', exist_ok=True)

# 1. CORE
core = "// js/components/core.js\n"
core += get(1, 157).replace("class StorageService", "export class StorageService")
core += "export " + get(169, 318)
core += "export " + get(973, 988)
core += "export " + get(1144, 1182)
core += "export const StorageServiceInstance = StorageService;\n"
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/core.js', 'w') as f: f.write(core)

# 2. AUTH
auth = """import { StorageServiceInstance as StorageService, setView } from './core.js';
import { renderStage } from './feed.js';
import { renderJobs } from './jobs.js';

"""
auth += get(1047, 1141)
auth += get(1359, 1487)
auth = auth.replace("function checkOnboarding()", "export function checkOnboarding()")
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/auth.js', 'w') as f: f.write(auth)

# 3. FEED
feed = """import { StorageServiceInstance as StorageService } from './core.js';
import { openTalentProfile } from './network.js';
import { openChat, renderChatList } from './chat.js';

const greenroomFeed = document.querySelector('#greenroom-feed');
const uploaderModal = document.querySelector('#uploader-modal');
const openUploadBtn = document.querySelector('#open-upload-btn');
const openUploadBtnMobile = document.querySelector('#open-upload-btn-mobile');
const closeUploadBtn = document.querySelector('#close-uploader-btn');
const fileInput = document.querySelector('#file-input');
const uploadArea = document.querySelector('#drop-zone');
const uploadingState = document.querySelector('#uploading-state');
const uploadProgress = document.querySelector('#upload-progress');

"""
feed += get(340, 497).replace("async function renderStage()", "export async function renderStage()")
feed += get(1192, 1289).replace("async function handleRealUpload", "export async function handleRealUpload")
feed += get(591, 616).replace("function renderTrendingWidget()", "export function renderTrendingWidget()")
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/feed.js', 'w') as f: f.write(feed)

# 4. NETWORK
net = """import { StorageServiceInstance as StorageService } from './core.js';
import { openChat } from './chat.js';

const talentGrid = document.querySelector('#talent-grid');
const talentProfileModal = document.querySelector('#talent-profile-modal');

"""
net += get(689, 712).replace("async function fetchCreatorsFromDB", "export async function fetchCreatorsFromDB")
net += get(714, 794).replace("async function renderNetworkBoard", "export async function renderNetworkBoard")
net += get(796, 865).replace("async function openTalentProfile", "export async function openTalentProfile")
net += get(1513, 1606).replace("function performSearch()", "export function performSearch()")
net += get(1732, 1749)
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/network.js', 'w') as f: f.write(net)

# 5. JOBS
jobs = """import { StorageServiceInstance as StorageService, setView } from './core.js';
import { openChat } from './chat.js';

const recentJobsFeed = document.querySelector('#recent-jobs-feed');
const featuredJobsCarousel = document.querySelector('#featured-jobs-carousel-content');
const applicantsSection = document.querySelector('#applicants-section');
const applicantsList = document.querySelector('#applicants-list');
const postJobModal = document.querySelector('#post-job-modal');
const postJobForm = document.querySelector('#post-job-form');
const currentJobTitleSpan = document.querySelector('#current-job-title');

"""
jobs += get(618, 686).replace("async function fetchJobsFromDB", "export async function fetchJobsFromDB").replace("async function renderJobs", "export async function renderJobs")
jobs += get(867, 918).replace("function viewApplicants", "export function viewApplicants").replace("function shortlistApplicant", "export function shortlistApplicant")
jobs += get(928, 970)
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/jobs.js', 'w') as f: f.write(jobs)

# 6. CHAT
chat = """import { StorageServiceInstance as StorageService, setView } from './core.js';

const chatWindow = document.querySelector('#chat-messages');
const chatList = document.querySelector('#chat-list');
const chatInput = document.querySelector('#chat-input');
const chatHeader = document.querySelector('#chat-header');
const chatInputArea = document.querySelector('#chat-input-area');
const chatUserName = document.querySelector('#chat-user-name');
let activeChatId = null;

"""
chat += get(537, 587).replace("function renderChatList", "export function renderChatList").replace("function openChat", "export function openChat").replace("function renderMessages", "export function renderMessages")
chat += get(1306, 1326)
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/js/components/chat.js', 'w') as f: f.write(chat)

# 7. MAIN APP.JS REWRITE
main = """import { StorageServiceInstance as StorageService, setLanguage, setView } from './js/components/core.js';
import { checkOnboarding } from './js/components/auth.js';
import { renderStage, renderTrendingWidget } from './js/components/feed.js';
import { renderNetworkBoard } from './js/components/network.js';
import { renderJobs } from './js/components/jobs.js';
import { renderChatList } from './js/components/chat.js';

window.StorageService = StorageService; 

document.addEventListener('DOMContentLoaded', () => {
  try {
    const loadingPhrases = ["Setting the Stage...", "Rolling Camera...", "Finding your Crew..."];
    let phraseIndex = 0;
    const phraseEl = document.getElementById('loading-phrase');
    const phraseInterval = setInterval(() => {
      phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
      if (phraseEl) phraseEl.textContent = loadingPhrases[phraseIndex];
    }, 500);

    setTimeout(() => { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); }, 1200);

    setTimeout(() => {
      clearInterval(phraseInterval);
      const splash = document.getElementById('splash-screen');
      if (splash) splash.style.display = 'none';

      window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          const authScreen = document.getElementById('auth-screen');
          if (authScreen) authScreen.style.display = 'flex';
        } else {
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('identity-gate-modal').style.display = 'none';
          renderStage();
        }
      });
    }, 1500);
  } catch (error) {
    console.error("Splash Screen Error: ", error);
  }
});

window.kalakarVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (!video || video.tagName !== 'VIDEO') return;
    if (entry.isIntersecting) { if (video.paused) video.play().catch(e => console.log('Autoplay prevented', e)); } 
    else { if (!video.paused) video.pause(); }
  });
}, { threshold: 0.6 });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(r => console.log('SW registered')).catch(e => console.log('SW error', e));
  });
}

document.getElementById('sidebar-trigger')?.addEventListener('click', () => document.getElementById('sidebar-drawer').classList.remove('hidden'));
document.getElementById('close-sidebar')?.addEventListener('click', () => document.getElementById('sidebar-drawer').classList.add('hidden'));
document.getElementById('sidebar-drawer')?.addEventListener('click', (e) => { if (e.target.id === 'sidebar-drawer') e.target.classList.add('hidden'); });

const desktopPostInput = document.querySelector('.create-post-pill .post-input-btn');
if (desktopPostInput) desktopPostInput.addEventListener('click', (e) => e.target.closest('.create-post-pill').classList.toggle('expanded'));

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-target]');
  if (trigger && !e.target.closest('.open-chat-btn')) {
    e.preventDefault();
    const targetId = trigger.getAttribute('data-target');
    const modal = document.getElementById(targetId + '-modal');
    if (modal) {
        document.querySelectorAll('.slide-modal.active').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
    }
  }
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) {
    e.preventDefault();
    const modal = document.getElementById(closeBtn.getAttribute('data-close'));
    if (modal) modal.classList.remove('active');
  }
});

setLanguage('en');
setView('feed');

window.renderStage = renderStage;
window.renderJobs = renderJobs;
window.renderNetworkBoard = renderNetworkBoard;
window.setView = setView;
"""
with open('/Users/abhishekpravinnahire/Desktop/kalakar.in/app.js', 'w') as f: f.write(main)
print("COMPLETED SPLIT!")
