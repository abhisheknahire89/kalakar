// js/components/core.js
// Storage Service for persistence
export class StorageService {
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
    localStorage.removeItem('kalakar_creators'); // Force refresh of creators list
    localStorage.removeItem(this.KEYS.USER); // Reset user state

    if (!this.get(this.KEYS.USER)) {
      this.set(this.KEYS.USER, 'user_' + Math.random().toString(36).substr(2, 9));
    }

    if (!this.get(this.KEYS.JOBS)) {
      this.set(this.KEYS.JOBS, [
        {
          id: 'j1',
          title: 'Lead Actor (Male, 28-35)',
          company: 'Excel Entertainment',
          type: 'Web Series',
          location: 'Mumbai',
          roleType: 'Acting',
          urgent: true,
          tags: ['Action', 'Hindi', 'Lead'],
          createdAt: Date.now() - 3600000 * 2,
          verified: true
        },
        {
          id: 'j2',
          title: 'Senior Colorist',
          company: 'Red Chillies VFX',
          type: 'Feature Film',
          location: 'Remote',
          roleType: 'Post-Production',
          urgent: true,
          tags: ['DaVinci Resolve', 'HDR', 'Color Grading'],
          createdAt: Date.now() - 3600000 * 5,
          verified: true
        },
        {
          id: 'j3',
          title: 'Associate Director',
          company: 'Dharma Productions',
          type: 'Feature Film',
          location: 'London / Mumbai',
          roleType: 'Direction',
          urgent: false,
          tags: ['Schedule-heavy', 'UK Visa'],
          createdAt: Date.now() - 3600000 * 24,
          verified: true
        },
        {
          id: 'j4',
          title: 'Sync Sound Mixer',
          company: 'Phantom Studios',
          type: 'Indie Feature',
          location: 'Pune',
          roleType: 'Sound',
          urgent: false,
          tags: ['Location Sound', 'Marathi'],
          createdAt: Date.now() - 3600000 * 48,
          verified: true
        },
        {
          id: 'j5',
          title: 'Gaffer',
          company: 'YRF Web',
          type: 'Series',
          location: 'Delhi',
          roleType: 'Camera',
          urgent: false,
          tags: ['ARRI SkyPanels'],
          createdAt: Date.now() - 3600000 * 72,
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
          vouchedBy: 'Anurag Kashyap',
          city: 'Mumbai',
          dept: 'Direction', // Example for testing
          kit: 'None',
          union: 'Verified'
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
          vouchedBy: 'Sudeep Chatterjee',
          city: 'Pune',
          dept: 'Camera',
          kit: 'Alexa 35',
          union: 'Verified'
        },
        {
          id: 'c_me',
          name: 'My Profile',
          role: 'Actor',
          verified: true,
          credits: [],
          videoUrl: '',
          vouchedBy: 'System',
          city: 'Nashik',
          dept: 'Direction',
          kit: 'RED V-Raptor',
          union: 'Non-Union'
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

export const translations = {
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
export function setLanguage(lang) {
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
export function setView(name) {
  const views = {
    'feed': document.querySelector('#feed-view'),
    'jobs': document.querySelector('#jobs-view'),
    'network': document.querySelector('#network-view'),
    'projects': document.querySelector('#projects-view'),
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
    if (name === 'network') renderNetworkBoard();
    if (name === 'projects') renderProjectsBoard();
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
export const StorageServiceInstance = StorageService;
