// Storage Service for persistence
class StorageService {
  static KEYS = {
    JOBS: 'kalakar_jobs',
    APPLICATIONS: 'kalakar_applications',
    MESSAGES: 'kalakar_messages',
    USER: 'kalakar_user_id'
  };

  static get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static init() {
    if (!this.get(this.KEYS.USER)) {
      this.set(this.KEYS.USER, 'user_' + Math.random().toString(36).substr(2, 9));
    }

    if (!this.get(this.KEYS.JOBS)) {
      this.set(this.KEYS.JOBS, [
        {
          id: 'j1',
          title: 'Assistant Director (1st AD Team)',
          type: 'Feature Film',
          location: 'Mumbai',
          duration: '45 days',
          budget: 'Mid-budget',
          posterId: 'system',
          createdAt: Date.now() - 3600000 * 24 * 2,
          verified: true
        }
      ]);
    }

    if (!this.get('kalakar_creators')) {
      this.set('kalakar_creators', [
        {
          id: 'c1',
          name: 'Ishaan Verma',
          role: 'Actor/Dancer',
          verified: true,
          credits: [
            { title: 'Sacred Games', role: 'Bunty', status: 'Verified' },
            { title: 'The Family Man', role: 'Support', status: 'Verified' }
          ],
          videoUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80', // Placeholder
          vouchedBy: 'Anurag Kashyap'
        },
        {
          id: 'c2',
          name: 'Alisha Rao',
          role: 'Cinematographer',
          verified: true,
          credits: [
            { title: 'Mardaani 2', role: '2nd Unit DOP', status: 'Verified' }
          ],
          videoUrl: 'https://images.unsplash.com/photo-1533750516457-47f0171bb3ee?auto=format&fit=crop&w=800&q=80', // Placeholder
          vouchedBy: 'Sudeep Chatterjee'
        }
      ]);
    }


    if (!this.get(this.KEYS.APPLICATIONS)) {
      this.set(this.KEYS.APPLICATIONS, [
        { id: 'a1', jobId: 'j1', name: 'Rohan Joshi', role: 'AD', status: 'pending', createdAt: Date.now() - 3600000 * 5 },
        { id: 'a2', jobId: 'j1', name: 'Simran Sheikh', role: 'AD', status: 'pending', createdAt: Date.now() - 3600000 * 2 },
        { id: 'a3', jobId: 'j2', name: 'Priya Deshmukh', role: 'Actor', status: 'pending', createdAt: Date.now() - 3600000 * 1 }
      ]);
    }

    if (!this.get(this.KEYS.MESSAGES)) {
      this.set(this.KEYS.MESSAGES, []);
    }
  }
}

StorageService.init();

const navButtons = document.querySelectorAll('.nav-btn');
const langButtons = document.querySelectorAll('.lang-btn');
const i18nNodes = document.querySelectorAll('[data-i18n]');

const views = {
  feed: document.querySelector('#feed-view'),
  jobs: document.querySelector('#jobs-view'),
  projects: document.querySelector('#projects-view'),
  messages: document.querySelector('#messages-view')
};

const translations = {
  en: {
    brandSubtitle: 'Maharashtra Film Network + Production OS',
    navFeed: 'Feed',
    navJobs: 'Jobs',
    navProjects: 'Projects',
    navMessages: 'Messages',
    talentSearch: 'Talent Search',
    postOpportunity: 'Post Opportunity',
    eyebrow: 'Maharashtra launch market',
    heroTitle: 'Trusted hiring and collaboration for film professionals.',
    heroCopy:
      'Built for production houses, casting teams, freelancers, and studios to discover verified talent, hire faster, and manage real shoot operations.',
    createProfile: 'Create Profile',
    postJob: 'Post Crew/Casting Job',
    statProfessionals: 'Active film professionals',
    statOpenings: 'Live hiring openings',
    statProjects: 'Active productions',
    pulseTitle: 'Maharashtra Hiring Pulse',
    pulse1: 'Mumbai: Casting call open for Marathi feature lead (Female, 22-28).',
    pulse2: 'Pune: Hiring 2nd AD and Gaffer for 12-day schedule.',
    pulse3: 'Kolhapur: Costume and Art assistants needed for period drama.',
    pulse4: 'Nashik: Line producer shortlist under review for ad film campaign.',
    quickActions: 'Quick Actions',
    actionCasting: 'Post Casting Call',
    actionCrew: 'Hire Crew',
    actionWorkspace: 'Create Project Workspace',
    actionPortfolio: 'Share Showreel',
    filters: 'Search Filters',
    filterCity: 'City',
    filterLanguage: 'Language',
    filterDepartment: 'Department',
    langAny: 'Any',
    langMarathi: 'Marathi',
    langHindi: 'Hindi',
    langMarathiHindi: 'Marathi + Hindi',
    deptAll: 'All Departments',
    deptDirection: 'Direction',
    deptCamera: 'Camera',
    deptSound: 'Sound',
    deptArt: 'Art',
    deptPost: 'Post Production',
    feedTitle: 'Feed',
    feedCard1Title: 'Director Update: Table Read Week',
    feedCard1Body: 'City of Dust begins table reads Monday. Looking for a bilingual script supervisor.',
    feedCard1Meta: 'Meera Sharma, Director · 1h ago',
    feedCard2Title: 'Festival Win',
    feedCard2Body: 'Rain Between Cuts won Best Editing at IndieFrame Goa 2026.',
    feedCard2Meta: 'Arjun Menon, Editor · 4h ago',
    jobsTitle: 'Jobs & Casting',
    jobCard1Title: 'Assistant Director (1st AD Team)',
    jobCard1Body: 'Feature Film · Mumbai · 45 days · Mid-budget',
    jobCard1Meta: 'Applications: 54',
    apply: 'Apply',
    jobCard2Title: 'Female Lead (Age 22-28)',
    jobCard2Body: 'Streaming Series · Marathi + Hindi · Self tape required',
    jobCard2Meta: 'Closes: Feb 28, 2026',
    submitTape: 'Submit Self Tape',
    projectsTitle: 'Projects',
    projectCard1Body: 'Web Series · Pre-production · 62% schedule locked',
    projectTask1: 'Lock callback lineup by Tuesday, 11:00',
    projectTask2: 'Approve art recce budget revision',
    projectTask3: 'Sign camera vendor contract',
    messagesTitle: 'Messages',
    messageCard1Title: 'Neel Deshpande (Producer)',
    messageCard1Body: 'Can you send the updated line-production estimate by 7 PM?',
    messageCard1Meta: '14 min ago',
    suggestedTitle: 'Recommended Collaborators',
    collab1: 'Costume Designer · 16 verified credits',
    collab2: 'Sound Designer · 22 verified credits',
    collab3: 'Line Producer · 31 projects',
    profileStrength: 'Profile Strength',
    profileHint: 'Add 2 verified credits and 1 recommendation to reach 90%.',
    completeProfile: 'Complete Profile'
  },
  mr: {
    brandSubtitle: 'महाराष्ट्र फिल्म नेटवर्क + प्रॉडक्शन OS',
    navFeed: 'फीड',
    navJobs: 'जॉब्स',
    navProjects: 'प्रोजेक्ट्स',
    navMessages: 'मेसेजेस',
    talentSearch: 'टॅलेंट शोधा',
    postOpportunity: 'संधी पोस्ट करा',
    eyebrow: 'महाराष्ट्र प्राथमिक बाजार',
    heroTitle: 'फिल्म प्रोफेशनल्ससाठी विश्वासार्ह हायरिंग आणि कोलॅबोरेशन.',
    heroCopy:
      'प्रॉडक्शन हाऊस, कास्टिंग टीम्स, फ्रीलान्सर्स आणि स्टुडिओसाठी एकत्रित प्लॅटफॉर्म - verified talent शोधा, जलद हायर करा आणि शूट ऑपरेशन्स व्यवस्थापित करा.',
    createProfile: 'प्रोफाइल तयार करा',
    postJob: 'क्रू/कास्टिंग जॉब पोस्ट करा',
    statProfessionals: 'सक्रिय फिल्म प्रोफेशनल्स',
    statOpenings: 'सध्या सुरू असलेल्या हायरिंग संधी',
    statProjects: 'सक्रिय प्रॉडक्शन्स',
    pulseTitle: 'महाराष्ट्र हायरिंग पल्स',
    pulse1: 'मुंबई: मराठी फीचर लीडसाठी कास्टिंग कॉल सुरू (महिला, 22-28).',
    pulse2: 'पुणे: 12 दिवसांच्या शेड्यूलसाठी 2nd AD आणि गॅफर हवे आहेत.',
    pulse3: 'कोल्हापूर: पिरियड ड्रामासाठी कॉस्ट्यूम आणि आर्ट असिस्टंट्स हवे आहेत.',
    pulse4: 'नाशिक: अॅड फिल्म मोहिमेसाठी लाईन प्रोड्यूसर शॉर्टलिस्ट पुनरावलोकनात.',
    quickActions: 'क्विक अॅक्शन्स',
    actionCasting: 'कास्टिंग कॉल पोस्ट करा',
    actionCrew: 'क्रू हायर करा',
    actionWorkspace: 'प्रोजेक्ट वर्कस्पेस तयार करा',
    actionPortfolio: 'शोरील शेअर करा',
    filters: 'सर्च फिल्टर्स',
    filterCity: 'शहर',
    filterLanguage: 'भाषा',
    filterDepartment: 'विभाग',
    langAny: 'कोणतीही',
    langMarathi: 'मराठी',
    langHindi: 'हिंदी',
    langMarathiHindi: 'मराठी + हिंदी',
    deptAll: 'सर्व विभाग',
    deptDirection: 'दिग्दर्शन',
    deptCamera: 'कॅमेरा',
    deptSound: 'साउंड',
    deptArt: 'आर्ट',
    deptPost: 'पोस्ट प्रॉडक्शन',
    feedTitle: 'फीड',
    feedCard1Title: 'दिग्दर्शक अपडेट: टेबल रीड आठवडा',
    feedCard1Body: 'City of Dust चे टेबल रीड्स सोमवारपासून सुरू. द्विभाषिक स्क्रिप्ट सुपरवायझर हवा आहे.',
    feedCard1Meta: 'मीरा शर्मा, दिग्दर्शक · 1 तासापूर्वी',
    feedCard2Title: 'फेस्टिव्हल विजय',
    feedCard2Body: 'Rain Between Cuts ला IndieFrame Goa 2026 मध्ये बेस्ट एडिटिंग पुरस्कार मिळाला.',
    feedCard2Meta: 'अर्जुन मेनन, एडिटर · 4 तासांपूर्वी',
    jobsTitle: 'जॉब्स आणि कास्टिंग',
    jobCard1Title: 'असिस्टंट डायरेक्टर (1st AD टीम)',
    jobCard1Body: 'फीचर फिल्म · मुंबई · 45 दिवस · मिड बजेट',
    jobCard1Meta: 'अर्ज: 54',
    apply: 'अर्ज करा',
    jobCard2Title: 'फीमेल लीड (वय 22-28)',
    jobCard2Body: 'स्ट्रीमिंग सिरीज · मराठी + हिंदी · सेल्फ टेप आवश्यक',
    jobCard2Meta: 'शेवटची तारीख: 28 फेब्रुवारी 2026',
    submitTape: 'सेल्फ टेप सबमिट करा',
    projectsTitle: 'प्रोजेक्ट्स',
    projectCard1Body: 'वेब सिरीज · प्री-प्रॉडक्शन · 62% शेड्यूल लॉक',
    projectTask1: 'मंगळवार 11:00 पर्यंत कॉलबॅक लाइनअप लॉक करा',
    projectTask2: 'आर्ट रेकी बजेट रिव्हिजन मंजूर करा',
    projectTask3: 'कॅमेरा विक्रेता कॉन्ट्रॅक्ट साइन करा',
    messagesTitle: 'मेसेजेस',
    messageCard1Title: 'नील देशपांडे (प्रोड्यूसर)',
    messageCard1Body: 'अपडेटेड लाईन-प्रॉडक्शन अंदाज संध्याकाळी 7 वाजेपर्यंत पाठवू शकता का?',
    messageCard1Meta: '14 मिनिटांपूर्वी',
    suggestedTitle: 'शिफारस केलेले कोलॅबोरेटर्स',
    collab1: 'कॉस्ट्यूम डिझायनर · 16 verified credits',
    collab2: 'साउंड डिझायनर · 22 verified credits',
    collab3: 'लाईन प्रोड्यूसर · 31 प्रोजेक्ट्स',
    profileStrength: 'प्रोफाइल स्ट्रेंथ',
    profileHint: '90% साठी 2 verified credits आणि 1 recommendation जोडा.',
    completeProfile: 'प्रोफाइल पूर्ण करा'
  }
};

const talentProfileModal = document.querySelector('#talent-profile-modal');
const chatWindow = document.querySelector('#chat-messages');
const chatList = document.querySelector('#chat-list');
const chatInput = document.querySelector('#chat-input');
const chatHeader = document.querySelector('#chat-header');
const chatInputArea = document.querySelector('#chat-input-area');
const chatUserName = document.querySelector('#chat-user-name');
let activeChatId = null;

const jobsList = document.querySelector('#jobs-list');
const applicantsSection = document.querySelector('#applicants-section');
const applicantsList = document.querySelector('#applicants-list');
const postJobModal = document.querySelector('#post-job-modal');
const postJobForm = document.querySelector('#post-job-form');
const currentJobTitleSpan = document.querySelector('#current-job-title');
const greenroomFeed = document.querySelector('#greenroom-feed');

function renderStage() {
  const creators = StorageService.get('kalakar_creators') || [];
  greenroomFeed.innerHTML = '';

  // NOISE REDUCTION: Only show creators who are Verified OR have at least one Credit
  const verifiedCreators = creators.filter(c => c.verified === true || c.credits?.length > 0);

  if (verifiedCreators.length === 0) {
    greenroomFeed.innerHTML = '<div class="empty-state">No verified professionals found.</div>';
    return;
  }

  // Add Verification Banner
  const banner = document.createElement('div');
  banner.innerHTML = `<div style="background: rgba(255, 215, 0, 0.1); color: var(--brand-gold); padding: 0.5rem; text-align: center; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; border: 1px solid rgba(255, 215, 0, 0.2);">💎 Displaying Verified Professionals Only</div>`;
  greenroomFeed.appendChild(banner);

  verifiedCreators.forEach(creator => {
    const slot = document.createElement('div');
    slot.className = 'video-slot';
    slot.innerHTML = `
      <img src="${creator.videoUrl}" class="video-placeholder" alt="Proof of Craft">
      <div class="floating-score">⭐ <span class="score-val score-val-${creator.id}">${creator.reliability || 98}%</span> VOUCHED</div>
      <div class="vouch-badge">
        <span class="vouch-icon">✓</span> Vouched by ${creator.vouchedBy}
      </div>
      <div class="hire-overlay">
        <div class="creator-info">
          <div class="creator-name">
            ${creator.name} 
            ${creator.verified ? '<span class="verified-icon" title="Verified Professional">★</span>' : ''}
          </div>
          <p>${creator.role} · Reliability: <span class="score-text score-val-${creator.id}">${creator.reliability || 98}%</span></p>
        <div class="video-tags">
          <span class="craft-tag">#${creator.tags?.[0] || 'Monologue'}</span>
          <span class="craft-tag">#${creator.tags?.[1] || 'Dramatic'}</span>
        </div>
        <div class="action-row" style="margin-top: 15px;">
          <button class="ghost small view-prof-btn" data-id="${creator.id}">View Proof of Craft</button>
        </div>
        <div class="interaction-stack">
          <button class="circle-btn vouch-talent-btn" data-id="${creator.id}">
            <span class="vouch-icon">✓</span>
            <small>Vouch</small>
          </button>
          <button class="circle-btn shortlist-talent-btn" data-id="${creator.id}">
            <span>HIRE</span>
          </button>
          <button class="hire-badge open-chat-btn" data-id="${creator.id}">MESSAGE</button>
        </div>
      </div>
    `;
    greenroomFeed.appendChild(slot);
  });

  document.querySelectorAll('.view-prof-btn').forEach(btn => {
    btn.addEventListener('click', () => openTalentProfile(btn.dataset.id));
  });

  document.querySelectorAll('.vouch-talent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.vouched) return; // prevent double click
      btn.dataset.vouched = 'true';

      btn.style.background = 'var(--brand-gold)';
      btn.style.color = 'black';
      btn.innerHTML = '<span class="vouch-icon">✓</span><small>Vouched</small>';

      // WEIGHTED Vouch Sync
      const id = btn.dataset.id;
      const creators = StorageService.get('kalakar_creators') || [];
      const creatorIndex = creators.findIndex(c => c.id === id);
      if (creatorIndex > -1) {
        creators[creatorIndex].vp = (creators[creatorIndex].vp || 0) + 1; // Increment VP for trending
        // Weighted logic: Vouching by a verified user adds 5% instead of 1%
        creators[creatorIndex].reliability = Math.min(100, (creators[creatorIndex].reliability || 98) + 5);
        StorageService.set('kalakar_creators', creators);

        // Update UI optimistically
        const scoreEl = document.querySelector(`.score-val-${id}`);
        if (scoreEl) scoreEl.textContent = creators[creatorIndex].reliability + '%';

        const cardScoreEl = document.querySelector(`#prof-rel-score`);
        if (cardScoreEl && document.querySelector('#prof-name').textContent === creators[creatorIndex].name) {
          cardScoreEl.textContent = creators[creatorIndex].reliability + '%';
        }

        renderTrendingWidget(); // re-render trending
      }
    });
  });

  document.querySelectorAll('.shortlist-talent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.style.background = 'var(--brand-gold)';
      btn.style.color = 'black';
      btn.innerHTML = '<span>SAVED</span>';

      const id = btn.dataset.id;
      const shortlist = StorageService.get('kalakar_shortlist') || [];
      if (!shortlist.includes(id)) {
        shortlist.push(id);
        StorageService.set('kalakar_shortlist', shortlist);
        renderShortlist(); // Update the manager view
      }
    });
  });
  document.querySelectorAll('.open-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openChat(btn.dataset.id);
    });
  });
}

function openTalentProfile(creatorId) {
  const creators = StorageService.get('kalakar_creators');
  const creator = creators.find(c => c.id === creatorId);

  document.querySelector('#prof-name').textContent = creator.name;
  document.querySelector('#prof-vouch').textContent = creator.vouchedBy;

  const creditsList = document.querySelector('#prof-credits-list');
  creditsList.innerHTML = `
    <table class="credits-table">
      <thead>
        <tr>
          <th>Project</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${creator.credits.map(cr => `
          <tr>
            <td><strong>${cr.title}</strong></td>
            <td>${cr.role}</td>
            <td><div class="verified-cell">✔ Verified</div></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  talentProfileModal.classList.add('active');

  document.querySelector('.prof-hire-btn').onclick = () => {
    if (navigator.vibrate) navigator.vibrate([100]); // Heavy Haptic Feedback
    talentProfileModal.classList.remove('active');
    openChat(creatorId);
  };
}

function renderChatList() {
  const creators = StorageService.get('kalakar_creators');
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];

  chatList.innerHTML = '';
  // Only show chats that have messages or are "Active Deals"
  creators.forEach(creator => {
    const lastMsg = messages.filter(m => m.chatId === creator.id).pop();
    const item = document.createElement('div');
    item.className = `chat-item ${activeChatId === creator.id ? 'active' : ''}`;
    item.innerHTML = `
      <h4>${creator.name}</h4>
      <p>${lastMsg ? lastMsg.text : 'Initiate project deal...'}</p>
    `;
    item.onclick = () => openChat(creator.id);
    chatList.appendChild(item);
  });
}

function openChat(creatorId) {
  activeChatId = creatorId;
  const creators = StorageService.get('kalakar_creators');
  const creator = creators.find(c => c.id === creatorId);

  chatUserName.textContent = creator.name;
  chatHeader.classList.remove('hidden');
  chatInputArea.classList.remove('hidden');

  renderMessages();
  renderChatList();
  setView('messages');
}

function renderMessages() {
  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
  const currentUserId = StorageService.get(StorageService.KEYS.USER);
  const chatMsgs = messages.filter(m => m.chatId === activeChatId);

  chatWindow.innerHTML = '';
  if (chatMsgs.length === 0) {
    chatWindow.innerHTML = '<div class="empty-state">Professional communication channel opened. Safe for deal terms.</div>';
  }

  chatMsgs.forEach(m => {
    const div = document.createElement('div');
    div.className = `chat-message ${m.senderId === currentUserId ? 'sent' : 'received'}`;
    div.textContent = m.text;
    chatWindow.appendChild(div);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.querySelector('#send-msg-btn').addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text || !activeChatId) return;

  const messages = StorageService.get(StorageService.KEYS.MESSAGES) || [];
  messages.push({
    chatId: activeChatId,
    senderId: StorageService.get(StorageService.KEYS.USER),
    text: text,
    timestamp: Date.now()
  });

  StorageService.set(StorageService.KEYS.MESSAGES, messages);
  chatInput.value = '';
  renderMessages();
  renderChatList();
});

function renderTrendingWidget() {
  const trendingList = document.querySelector('#trending-list');
  if (!trendingList) return;

  const creators = StorageService.get('kalakar_creators') || [];

  // Simulate trending logic based on random high vouch counts for the demo
  const trendingData = [
    { name: creators[0]?.name || 'Ishaan Verma', role: 'Actor/Dancer', vouches: 84 },
    { name: 'Priya Joshi', role: 'Writer', vouches: 62 },
    { name: creators[1]?.name || 'Alisha Rao', role: 'Cinematographer', vouches: 45 }
  ];

  trendingList.innerHTML = trendingData.map(t => `
    <div class="trending-item">
      <div class="trending-info">
        <h4>${t.name}</h4>
        <p>${t.role}</p>
      </div>
      <div class="vouch-count">
        ✓ ${t.vouches}
      </div>
    </div>
  `).join('');
}

function renderJobs(filter = 'all') {

  const allJobs = StorageService.get(StorageService.KEYS.JOBS) || [];
  const currentUserId = StorageService.get(StorageService.KEYS.USER);

  const filteredJobs = filter === 'my'
    ? allJobs.filter(j => j.posterId === currentUserId || j.posterId === 'system') // Mock 'my' for demo
    : allJobs;

  jobsList.innerHTML = '';
  applicantsSection.classList.add('hidden');
  jobsList.classList.remove('hidden');

  filteredJobs.sort((a, b) => b.createdAt - a.createdAt).forEach(job => {
    const apps = StorageService.get(StorageService.KEYS.APPLICATIONS) || [];
    const jobApps = apps.filter(a => a.jobId === job.id);

    const card = document.createElement('article');
    card.className = 'card';
    card.style.borderLeft = job.verified ? '4px solid var(--brand-gold)' : '1px solid var(--line)';
    card.innerHTML = `
      <div class="card-row">
        <h3>${job.title} ${job.verified ? '<span class="verified-icon" title="Verified Production">★</span>' : ''}</h3>
        <span class="badge">${job.type}</span>
      </div>
      <p>${job.location} · ${job.budget || 'Competitive'}</p>
      <div class="card-row" style="margin-top: 10px;">
        <p class="meta">Verified Applicants: ${jobApps.filter(a => a.status === 'shortlisted').length} / ${jobApps.length}</p>
        <div class="actions">
          ${job.posterId === currentUserId || job.posterId === 'system'
        ? `<button class="ghost small view-apps-btn" data-id="${job.id}">Manage Production</button>`
        : `<button class="primary small">Submit Proposal</button>`}
        </div>
      </div>
    `;
    jobsList.appendChild(card);
  });

  // Attach events
  document.querySelectorAll('.view-apps-btn').forEach(btn => {
    btn.addEventListener('click', () => viewApplicants(btn.dataset.id));
  });
}

function viewApplicants(jobId) {
  const allJobs = StorageService.get(StorageService.KEYS.JOBS) || [];
  const job = allJobs.find(j => j.id === jobId);
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS) || [];
  const jobApps = apps.filter(a => a.jobId === jobId);

  currentJobTitleSpan.textContent = job.title;
  jobsList.classList.add('hidden');
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

function shortlistApplicant(appId, jobId) {
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS);
  const index = apps.findIndex(a => a.id === appId);
  if (index !== -1) {
    apps[index].status = 'shortlisted';
    StorageService.set(StorageService.KEYS.APPLICATIONS, apps);
    viewApplicants(jobId);
  }
}

function openChat(appId) {
  const apps = StorageService.get(StorageService.KEYS.APPLICATIONS);
  const app = apps.find(a => a.id === appId);
  alert(`Chat initialized with ${app.name}. \n\n(Persistent Messaging flow enabled for Shortlisted talent)`);
  // Switching to Messages view for demo
  setView('messages');
}

// Modal Logic
document.querySelector('#post-job-trigger').addEventListener('click', () => {
  postJobModal.classList.add('active');
});

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    postJobModal.classList.remove('active');
  });
});

postJobForm.addEventListener('submit', (e) => {
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

  postJobModal.classList.remove('active');
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

document.querySelector('.back-link').addEventListener('click', () => {
  renderJobs('all');
});

// Initialization
function setLanguage(lang) {
  const dictionary = translations[lang] || translations.en;

  i18nNodes.forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[key]) {
      node.textContent = dictionary[key];
    }
  });

  langButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.lang === lang);
  });

  document.documentElement.lang = lang === 'mr' ? 'mr' : 'en';
}

// SHORTLIST MANAGER
function renderShortlist() {
  const container = document.querySelector('#shortlist-items-container');
  const batchBtn = document.querySelector('#batch-invite-btn');
  const selectAll = document.querySelector('#select-all-shortlist');
  if (!container) return;

  const shortlistIds = StorageService.get('kalakar_shortlist') || [];
  const creators = StorageService.get('kalakar_creators') || [];

  const savedTalent = shortlistIds.map(id => creators.find(c => c.id === id)).filter(Boolean);

  if (savedTalent.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding: 3rem; text-align: center; color: var(--muted);">No talent in your shortlist yet. Hit 'HIRE' on The Stage to save them here.</div>`;
    batchBtn.disabled = true;
    batchBtn.textContent = 'Batch Invite to Scope (0 selected)';
    return;
  }

  container.innerHTML = savedTalent.map(creator => `
    <div class="shortlist-row">
      <div><input type="checkbox" class="shortlist-checkbox" data-id="${creator.id}"></div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <div class="avatar" style="background:var(--brand-gold); width:30px; height:30px; font-size:12px;">${creator.name.charAt(0)}</div>
        <strong>${creator.name}</strong>
      </div>
      <div style="color:var(--muted); font-size:0.9rem;">${creator.role}</div>
      <div>
         <button class="ghost small open-chat-btn" data-id="${creator.id}" style="padding:0.2rem 0.6rem;">Message</button>
      </div>
    </div>
  `).join('');

  // Re-attach chat listeners
  document.querySelectorAll('#shortlist-items-container .open-chat-btn').forEach(btn => {
    btn.addEventListener('click', () => openChat(btn.dataset.id));
  });

  // Checkbox logic
  const checkboxes = document.querySelectorAll('.shortlist-checkbox');

  const updateBatchBtn = () => {
    const selected = document.querySelectorAll('.shortlist-checkbox:checked').length;
    batchBtn.disabled = selected === 0;
    batchBtn.textContent = `Batch Invite to Scope (${selected} selected)`;
  };

  checkboxes.forEach(cb => cb.addEventListener('change', updateBatchBtn));

  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      checkboxes.forEach(cb => cb.checked = e.target.checked);
      updateBatchBtn();
    });
  }
}

// ONBOARDING WIZARD LOGIC
const obWizard = document.querySelector('#onboarding-wizard');
const obStep1 = document.querySelector('#ob-step-1');
const obStep2 = document.querySelector('#ob-step-2');
const obStep3 = document.querySelector('#ob-step-3');

const obSyncBtn = document.querySelector('#ob-sync-btn');
const obSyncingState = document.querySelector('#ob-syncing-state');
const obRecordBtn = document.querySelector('#ob-record-btn');
const obTaggingState = document.querySelector('#ob-tagging-state');
const obNextToVouch = document.querySelector('#ob-next-to-vouch');
const obFinishBtn = document.querySelector('#ob-finish-btn');

function checkOnboarding() {
  const hasOnboarded = StorageService.get('kalakar_onboarded');
  if (!hasOnboarded) {
    obWizard.classList.remove('hidden');
  }
}

// Step 1: Sync
if (obSyncBtn) {
  obSyncBtn.addEventListener('click', () => {
    obSyncBtn.style.display = 'none';
    obSyncingState.classList.remove('hidden');

    // Simulate IMDb scraping
    setTimeout(() => {
      obStep1.classList.add('hidden');
      obStep2.classList.remove('hidden');
    }, 2000);
  });
}

// Step 2: Record
if (obRecordBtn) {
  obRecordBtn.addEventListener('click', () => {
    if (obRecordBtn.classList.contains('recording')) return;

    obRecordBtn.classList.add('recording');
    obRecordBtn.textContent = 'STOP';

    // Simulate 3 second recording
    setTimeout(() => {
      obRecordBtn.classList.remove('recording');
      obRecordBtn.textContent = 'ACTION';
      obRecordBtn.parentElement.style.display = 'none'; // hide controls

      // Show AI Tagging
      obTaggingState.classList.remove('hidden');

      setTimeout(() => document.querySelector('#tag-1').style.opacity = '1', 500);
      setTimeout(() => document.querySelector('#tag-2').style.opacity = '1', 1000);
      setTimeout(() => document.querySelector('#tag-3').style.opacity = '1', 1500);

      setTimeout(() => obNextToVouch.classList.remove('hidden'), 2500);

    }, 3000);
  });
}

if (obNextToVouch) {
  obNextToVouch.addEventListener('click', () => {
    obStep2.classList.add('hidden');
    obStep3.classList.remove('hidden');
  });
}

// Step 3: Finish
if (obFinishBtn) {
  obFinishBtn.addEventListener('click', () => {
    StorageService.set('kalakar_onboarded', true);
    obWizard.classList.add('hidden');

    // Inject the new user into the local database
    const creators = StorageService.get('kalakar_creators') || [];
    const newUser = {
      id: "ob_user_1",
      name: "You (New Artist)",
      role: "Actor",
      reliability: 50, // Starting score
      vouchedBy: "Pending",
      vp: 0,
      verified: true,
      tags: ["Mewari", "Intense"],
      credits: [{ title: "Verified via IMDb", role: "Var", year: 2023 }]
    };

    if (!creators.find(c => c.id === "ob_user_1")) {
      creators.unshift(newUser); // Add to top
      StorageService.set('kalakar_creators', creators);
      renderStage(); // Re-render to show themselves
    }
  });
}

// VIEW ROUTING
function setView(name) {
  const views = {
    'feed': document.querySelector('#feed-view'),
    'jobs': document.querySelector('#jobs-view'),
    'shortlist': document.querySelector('#shortlist-view'),
    'messages': document.querySelector('#messages-view')
  };

  Object.values(views).forEach(v => {
    if (v) v.classList.add('hidden');
  });

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });

  const activeView = views[name];
  if (activeView) {
    activeView.classList.remove('hidden');
    if (name === 'feed') renderStage();
    if (name === 'jobs') renderJobs();
    if (name === 'shortlist') renderShortlist();
    if (name === 'messages') renderChatList();

    // Animation
    const panel = activeView.querySelector('.panel') || activeView.querySelector('.messaging-layout') || activeView.querySelector('#greenroom-feed');
    if (panel) {
      panel.animate(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        { duration: 300, easing: 'ease-out' }
      );
    }
  }
}

langButtons.forEach((button) => {
  button.addEventListener('click', () => setLanguage(button.dataset.lang));
});

navButtons.forEach((button) => {
  button.addEventListener('click', () => setView(button.dataset.view));
});

// Uploader Logic
const uploaderModal = document.querySelector('#uploader-modal');
const openUploadBtn = document.querySelector('#open-upload-btn');
const closeUploadBtn = document.querySelector('#close-uploader-btn');
const fileInput = document.querySelector('#file-input');
const uploadArea = document.querySelector('#drop-zone');
const uploadingState = document.querySelector('#uploading-state');
const uploadProgress = document.querySelector('#upload-progress');

if (openUploadBtn) {
  openUploadBtn.addEventListener('click', () => {
    uploaderModal.classList.add('active');
  });
}

if (closeUploadBtn) {
  closeUploadBtn.addEventListener('click', () => {
    uploaderModal.classList.remove('active');
    // Reset state
    uploadArea.classList.remove('hidden');
    uploadingState.classList.add('hidden');
  });
}

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      simulateUpload();
    }
  });
}

function simulateUpload() {
  uploadArea.classList.add('hidden');
  uploadingState.classList.remove('hidden');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 20);
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      uploadProgress.textContent = progress + '%';
      setTimeout(() => {
        alert("Craft Vouched! Your entry for 'The Final Negotiation' is now live on The Stage.");
        uploaderModal.classList.remove('active');
        uploadArea.classList.remove('hidden');
        uploadingState.classList.add('hidden');
        fileInput.value = ''; // clear input
      }, 800);
    } else {
      uploadProgress.textContent = progress + '%';
    }
  }, 300);
}

// ==========================================
// PHASE 6: HIGH-AGENCY ONBOARDING
// ==========================================

window.addEventListener('load', () => {
  // 1. Emotional UI Splash Delay and Text
  const loadingPhrases = ["Setting the Stage...", "Rolling Camera...", "Finding your Crew..."];
  let phraseIndex = 0;
  const phraseEl = document.getElementById('loading-phrase');

  const phraseInterval = setInterval(() => {
    phraseIndex = (phraseIndex + 1) % loadingPhrases.length;
    if (phraseEl) phraseEl.textContent = loadingPhrases[phraseIndex];
  }, 500);

  setTimeout(() => {
    clearInterval(phraseInterval);
    const splash = document.getElementById('splash-screen');
    if (splash) splash.style.display = 'none';

    // Check if user already completed onboarding
    const creators = StorageService.get('kalakar_creators') || [];
    const myProfile = creators.find(c => c.id === 'c_me');

    if (!myProfile) {
      // Trigger Zero-Friction Auth
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) authScreen.style.display = 'flex';
    } else {
      // Skip auth, load dashboard
      renderStage();
      renderTrendingWidget();
    }
  }, 1500);
});

// Zero-Friction Auth Logic
document.getElementById('request-otp-btn')?.addEventListener('click', (e) => {
  const phone = document.getElementById('phone-input').value;
  if (phone.length >= 10) {
    e.target.style.display = 'none';
    document.getElementById('otp-verification-step').style.display = 'block';
    document.getElementById('otp-input').focus();
  } else {
    alert("Please enter a valid 10-digit number.");
  }
});

document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
  const otp = document.getElementById('otp-input').value;
  if (otp.length === 4) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('identity-gate-modal').style.display = 'flex';
  } else {
    alert("Please enter a 4-digit code.");
  }
});

// Identity Gate Logic
document.getElementById('btn-role-talent')?.addEventListener('click', () => {
  document.getElementById('identity-gate-modal').style.display = 'none';
  // Magic Moment: Talent (Trigger 3 step Onboarding Wizard)
  const wizard = document.querySelector('#onboarding-wizard');
  if (wizard) {
    wizard.classList.add('active');
    // Ensure we start at step 1
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.querySelector('#wizard-step-1').classList.add('active');
  }
});

document.getElementById('btn-role-studio')?.addEventListener('click', () => {
  document.getElementById('identity-gate-modal').style.display = 'none';

  // Magic Moment: Studio (Skeleton Loaders & Pro-Tips)
  const greenroomFeed = document.querySelector('#greenroom-feed');
  if (greenroomFeed) {
    greenroomFeed.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      `;
  }

  // Educational Snippet overlay
  const eduOverlay = document.createElement('div');
  eduOverlay.style.position = 'fixed';
  eduOverlay.style.bottom = '2rem';
  eduOverlay.style.left = '50%';
  eduOverlay.style.transform = 'translateX(-50%)';
  eduOverlay.style.background = 'var(--brand-gold)';
  eduOverlay.style.color = '#000';
  eduOverlay.style.padding = '1rem 2rem';
  eduOverlay.style.borderRadius = '30px';
  eduOverlay.style.fontWeight = 'bold';
  eduOverlay.style.zIndex = '9999';
  eduOverlay.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
  eduOverlay.style.fontFamily = 'Inter, sans-serif';
  eduOverlay.textContent = 'Pro-Tip: HOD vouches increase search rank by 40%';
  document.body.appendChild(eduOverlay);

  // Simulated API fetch delay
  setTimeout(() => {
    eduOverlay.remove();
    renderStage();
    renderTrendingWidget();
  }, 2500);
});

setLanguage('en');
setView('feed');
