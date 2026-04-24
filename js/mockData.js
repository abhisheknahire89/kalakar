const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const mockUsers = [
  {
    $id: 'user_aarav_actor',
    name: 'Aarav Kulkarni',
    primaryCraft: 'Actor',
    city: 'Mumbai',
    language: 'Marathi + Hindi',
    avatarFileId: '',
    isVerified: true,
    reliability: 93,
    vouchCount: 18,
    mutualConnections: 12,
    username: 'aaravk'
  },
  {
    $id: 'user_neha_dop',
    name: 'Neha Iyer',
    primaryCraft: 'DOP',
    city: 'Hyderabad',
    language: 'Hindi + Telugu',
    avatarFileId: '',
    isVerified: true,
    reliability: 90,
    vouchCount: 14,
    mutualConnections: 8,
    username: 'nehaframes'
  },
  {
    $id: 'user_pratik_editor',
    name: 'Pratik Deshmukh',
    primaryCraft: 'Editor',
    city: 'Pune',
    language: 'Marathi + English',
    avatarFileId: '',
    isVerified: false,
    reliability: 84,
    vouchCount: 9,
    mutualConnections: 6,
    username: 'cutbypratik'
  },
  {
    $id: 'user_sara_casting',
    name: 'Sara Khan',
    primaryCraft: 'Casting Director',
    city: 'Mumbai',
    language: 'Hindi + English',
    avatarFileId: '',
    isVerified: true,
    reliability: 96,
    vouchCount: 27,
    mutualConnections: 19,
    username: 'saracasts'
  },
  {
    $id: 'user_rohan_writer',
    name: 'Rohan Patil',
    primaryCraft: 'Writer',
    city: 'Pune',
    language: 'Marathi + Hindi',
    avatarFileId: '',
    isVerified: false,
    reliability: 81,
    vouchCount: 7,
    mutualConnections: 4,
    username: 'rohanwrites'
  }
];

const basePosts = [
  {
    $id: 'post_1',
    authorId: 'user_aarav_actor',
    contentText: 'New monologue reel from my latest workshop. Looking for feedback from casting teams.'
  },
  {
    $id: 'post_2',
    authorId: 'user_neha_dop',
    contentText: 'Lighting test for a noir short in Hyderabad. Shot on FX6 with vintage primes.'
  },
  {
    $id: 'post_3',
    authorId: 'user_pratik_editor',
    contentText: '30-second cut challenge: rhythm edit for a dance commercial in 4K.'
  },
  {
    $id: 'post_4',
    authorId: 'user_sara_casting',
    contentText: 'Open call this weekend in Mumbai for OTT thriller. DM profile links.'
  },
  {
    $id: 'post_5',
    authorId: 'user_rohan_writer',
    contentText: 'Table read snippets from our Marathi feature script session in Pune.'
  },
  {
    $id: 'post_6',
    authorId: 'user_aarav_actor',
    contentText: 'Audition prep routine: voice warmups + blocking in under 10 minutes.'
  },
  {
    $id: 'post_7',
    authorId: 'user_neha_dop',
    contentText: 'Street-lit scene test for an indie thriller. Practical lights only.'
  },
  {
    $id: 'post_8',
    authorId: 'user_pratik_editor',
    contentText: 'Fast-paced teaser cut done overnight for a startup ad campaign.'
  }
];

function buildMockPosts() {
  const withActivity = basePosts.map((post, index) => {
    const baseHoursAgo = index * 3 + 1;
    const jitterMinutes = randomInt(0, 95);
    const createdAt = new Date(now - baseHoursAgo * hour - jitterMinutes * 60 * 1000).toISOString();
    return {
      ...post,
      videoFileId: '',
      createdAt,
      likes: randomInt(72, 620),
      comments: randomInt(6, 88)
    };
  });

  return shuffle(withActivity);
}

export const mockPosts = buildMockPosts();

export const mockJobs = [
  {
    $id: 'job_1',
    title: 'Casting Call: Male Lead (24–30)',
    company: 'Maratha Motion Pictures',
    type: 'Feature Film',
    roleType: 'Acting',
    location: 'Mumbai',
    isUrgent: true,
    isVerified: true,
    createdAt: new Date(now - 3 * hour).toISOString(),
    timeline: 'Auditions close in 2 days'
  },
  {
    $id: 'job_2',
    title: 'Looking for DOP (Docu-Series)',
    company: 'Streamline Studios',
    type: 'Streaming Series',
    roleType: 'Crew',
    location: 'Hyderabad',
    isUrgent: false,
    isVerified: true,
    createdAt: new Date(now - 7 * hour).toISOString(),
    timeline: 'Shoot starts next week'
  },
  {
    $id: 'job_3',
    title: 'Editor Needed for Trailer Cut',
    company: 'CineGlow Entertainment',
    type: 'Ad Film',
    roleType: 'Crew',
    location: 'Pune',
    isUrgent: true,
    isVerified: false,
    createdAt: new Date(now - 12 * hour).toISOString(),
    timeline: 'Delivery in 72 hours'
  },
  {
    $id: 'job_4',
    title: 'Female Supporting Actor (20–28)',
    company: 'Bombay Fiction House',
    type: 'Short Film',
    roleType: 'Acting',
    location: 'Mumbai',
    isUrgent: false,
    isVerified: true,
    createdAt: new Date(now - 1 * day).toISOString(),
    timeline: 'Callback this Sunday'
  },
  {
    $id: 'job_5',
    title: 'Sound Designer for Thriller',
    company: 'Pune Indie Collective',
    type: 'Feature Film',
    roleType: 'Crew',
    location: 'Pune',
    isUrgent: false,
    isVerified: false,
    createdAt: new Date(now - 2 * day).toISOString(),
    timeline: '2-week sprint project'
  },
  {
    $id: 'job_6',
    title: 'Assistant Director (1st AD Team)',
    company: 'Deccan Filmworks',
    type: 'Streaming Series',
    roleType: 'Crew',
    location: 'Hyderabad',
    isUrgent: true,
    isVerified: true,
    createdAt: new Date(now - 2 * day - 6 * hour).toISOString(),
    timeline: 'Prep starts in 4 days'
  }
];

function buildMockMessages() {
  return [
    {
      id: 'msg_1',
      userId: 'user_sara_casting',
      name: 'Sara Khan',
      role: 'Casting Director',
      city: 'Mumbai',
      avatar: 'https://i.pravatar.cc/120?u=sara_khan',
      preview: 'Can you share your latest intro reel by tonight?',
      timestamp: new Date(now - randomInt(10, 55) * 60 * 1000).toISOString(),
      unread: randomInt(1, 3)
    },
    {
      id: 'msg_2',
      userId: 'user_neha_dop',
      name: 'Neha Iyer',
      role: 'DOP',
      city: 'Hyderabad',
      avatar: 'https://i.pravatar.cc/120?u=neha_iyer',
      preview: 'Let us lock camera tests for Friday.',
      timestamp: new Date(now - randomInt(1, 3) * hour).toISOString(),
      unread: randomInt(0, 1)
    },
    {
      id: 'msg_3',
      userId: 'user_pratik_editor',
      name: 'Pratik Deshmukh',
      role: 'Editor',
      city: 'Pune',
      avatar: 'https://i.pravatar.cc/120?u=pratik_d',
      preview: 'I have shared V2 cut. Please review.',
      timestamp: new Date(now - randomInt(4, 10) * hour).toISOString(),
      unread: randomInt(0, 2)
    },
    {
      id: 'msg_4',
      userId: 'user_rohan_writer',
      name: 'Rohan Patil',
      role: 'Writer',
      city: 'Pune',
      avatar: 'https://i.pravatar.cc/120?u=rohan_p',
      preview: 'We can do a quick table read tomorrow.',
      timestamp: new Date(now - randomInt(1, 2) * day).toISOString(),
      unread: 0
    }
  ];
}

export const mockMessages = buildMockMessages();

function buildMockNotifications() {
  const randomUser = mockUsers[randomInt(0, mockUsers.length - 1)];
  const randomJob = mockJobs[randomInt(0, mockJobs.length - 1)];

  return [
    {
      $id: `notif_like_${randomInt(100, 999)}`,
      type: 'like',
      text: `${randomUser.name} liked your post.`,
      isRead: false,
      createdAt: new Date(now - randomInt(8, 45) * 60 * 1000).toISOString()
    },
    {
      $id: `notif_conn_${randomInt(100, 999)}`,
      type: 'connection',
      text: `${randomUser.name} sent you a connection request.`,
      isRead: false,
      createdAt: new Date(now - randomInt(1, 4) * hour).toISOString()
    },
    {
      $id: `notif_job_${randomInt(100, 999)}`,
      type: 'job',
      text: `New posting in ${randomJob.location}: ${randomJob.title}.`,
      isRead: true,
      createdAt: new Date(now - randomInt(4, 12) * hour).toISOString()
    },
    {
      $id: `notif_msg_${randomInt(100, 999)}`,
      type: 'message',
      text: `${randomUser.name} replied in your chat.`,
      isRead: true,
      createdAt: new Date(now - randomInt(18, 34) * hour).toISOString()
    }
  ];
}

export const mockNotifications = buildMockNotifications();

export const mockConnections = [
  { id: 'conn_1', userId: 'user_sara_casting', mutual: 12 },
  { id: 'conn_2', userId: 'user_neha_dop', mutual: 8 },
  { id: 'conn_3', userId: 'user_pratik_editor', mutual: 6 },
  { id: 'conn_4', userId: 'user_rohan_writer', mutual: 4 }
];

export const mockCurrentProfile = {
  $id: 'user_demo_1',
  name: 'Ishaan Verma',
  username: 'ishaanverma',
  primaryCraft: 'Actor',
  city: 'Mumbai',
  language: 'Marathi + Hindi',
  bio: 'Actor focused on drama and thriller projects. Available for Mumbai and Pune schedules.',
  avatarFileId: '',
  profileViews: randomInt(980, 1860),
  impressions: randomInt(6400, 12400)
};

export function getUserById(userId) {
  return mockUsers.find((user) => user.$id === userId) || null;
}

export function formatRelativeTime(isoString) {
  const timestamp = new Date(isoString).getTime();
  const diff = Math.max(0, Date.now() - timestamp);

  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / (60 * 1000)))}m ago`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }
  return `${Math.floor(diff / day)}d ago`;
}
