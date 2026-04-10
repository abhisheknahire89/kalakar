import { databases, storage, ID, Query, DATABASE_ID, COLLECTIONS, BUCKETS, Permission, Role, getFilePreviewUrl, getFileViewUrl } from '../appwriteClient.js';
import { StorageServiceInstance as StorageService } from '../components/core.js';

const CACHE_KEYS = {
  posts: 'kalakar_local_posts',
  deals: 'kalakar_local_deals',
  messages: 'kalakar_local_messages',
  notifications: 'kalakar_local_notifications',
  reactions: 'kalakar_local_reactions'
};

const POSTS_COLLECTION = COLLECTIONS.POSTS || COLLECTIONS.posts;
const CREATORS_COLLECTION = COLLECTIONS.CREATORS || COLLECTIONS.creators;
const NOTIFICATIONS_COLLECTION = COLLECTIONS.NOTIFICATIONS || COLLECTIONS.notifications;
const MESSAGES_COLLECTION = COLLECTIONS.MESSAGES || COLLECTIONS.messages;
const DEALS_COLLECTION = COLLECTIONS.DEALS || COLLECTIONS.deals || COLLECTIONS.CONVERSATIONS || COLLECTIONS.conversations || COLLECTIONS.CONTRACTS || COLLECTIONS.contracts;
const MEDIA_BUCKET = BUCKETS.POST_MEDIA || BUCKETS.post_media || BUCKETS.REELS || BUCKETS.reels || BUCKETS.AVATARS || BUCKETS.avatars;
const AVATAR_BUCKET = BUCKETS.AVATARS || BUCKETS.avatars;

const DEMO_CREATORS = [
  {
    $id: 'demo_riya',
    userId: 'demo_riya',
    name: 'Riya Kale',
    username: 'riya_kale',
    primaryCraft: 'Actor',
    role: 'Actor',
    city: 'Mumbai',
    bio: 'Performance-led actor with ad film and OTT experience.',
    isVerified: true,
    vouchCount: 18
  },
  {
    $id: 'demo_aarav',
    userId: 'demo_aarav',
    name: 'Aarav Menon',
    username: 'aarav_menon',
    primaryCraft: 'Director',
    role: 'Director',
    city: 'Bengaluru',
    bio: 'Director building short-form worlds with strong visual identity.',
    isVerified: true,
    vouchCount: 26
  },
  {
    $id: 'demo_sana',
    userId: 'demo_sana',
    name: 'Sana Shaikh',
    username: 'sana_shaikh',
    primaryCraft: 'DOP',
    role: 'DOP',
    city: 'Pune',
    bio: 'Cinematographer for music videos, branded content, and indie features.',
    isVerified: false,
    vouchCount: 11
  }
];

const DEMO_POSTS = [
  {
    $id: 'demo_post_video',
    authorId: 'demo_aarav',
    contentText: 'Moodboard to master shot. We turned a rooftop rehearsal into a full launch film in 36 hours.',
    mediaType: 'video',
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    category: 'Director',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    likeCount: 124,
    commentCount: 12,
    shareCount: 7,
    saveCount: 18
  },
  {
    $id: 'demo_post_image',
    authorId: 'demo_sana',
    contentText: 'Blocking frames for a two-character tension scene. Loving the contrast in this setup.',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
    category: 'DOP',
    createdAt: new Date(Date.now() - 1000 * 60 * 135).toISOString(),
    likeCount: 88,
    commentCount: 5,
    shareCount: 3,
    saveCount: 14
  },
  {
    $id: 'demo_post_text',
    authorId: 'demo_riya',
    contentText: 'Reminder to every actor doing self-tapes: your pauses are part of the performance. Give them room.',
    mediaType: 'text',
    category: 'Actor',
    createdAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    likeCount: 61,
    commentCount: 9,
    shareCount: 4,
    saveCount: 9
  }
];

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function loadCache(key, fallback = []) {
  return safeParse(window.localStorage.getItem(key), fallback);
}

function saveCache(key, data) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

function upsertById(items, item) {
  const next = Array.isArray(items) ? [...items] : [];
  const index = next.findIndex((entry) => entry.$id === item.$id);
  if (index >= 0) next[index] = { ...next[index], ...item };
  else next.unshift(item);
  return next;
}

function getCurrentProfile() {
  return StorageService.get('kalakar_user_profile');
}

function getCurrentUserId() {
  return StorageService.get(StorageService.KEYS.USER) || getCurrentProfile()?.userId || '';
}

function buildAvatarUrl(profile) {
  if (profile?.avatarUrl) return profile.avatarUrl;
  if (profile?.avatarFileId) return getFilePreviewUrl(AVATAR_BUCKET, profile.avatarFileId);
  return `https://i.pravatar.cc/240?u=${encodeURIComponent(profile?.$id || profile?.userId || profile?.username || profile?.name || 'kalakar')}`;
}

function buildPostMedia(post) {
  if (post.mediaUrl) return post.mediaUrl;
  const bucketId = post.mediaBucket || post.bucketId || MEDIA_BUCKET;
  const fileId = post.mediaFileId || post.videoFileId || post.imageFileId || '';
  if (!fileId) return '';
  if ((post.mediaType || '').startsWith('image')) return getFilePreviewUrl(bucketId, fileId);
  return getFileViewUrl(bucketId, fileId);
}

function getReactions() {
  return loadCache(CACHE_KEYS.reactions, {});
}

function saveReactions(reactions) {
  saveCache(CACHE_KEYS.reactions, reactions);
}

async function safeListDocuments(collectionId, queries = []) {
  if (!collectionId) return [];
  try {
    const response = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    return response.documents || [];
  } catch (_) {
    return [];
  }
}

async function safeGetDocument(collectionId, documentId) {
  if (!collectionId || !documentId) return null;
  try {
    return await databases.getDocument(DATABASE_ID, collectionId, documentId);
  } catch (_) {
    return null;
  }
}

async function safeCreateDocument(collectionId, payload) {
  if (!collectionId) return null;
  try {
    return await databases.createDocument(DATABASE_ID, collectionId, ID.unique(), payload);
  } catch (_) {
    return null;
  }
}

function asUserId(profileOrId) {
  if (!profileOrId) return '';
  if (typeof profileOrId === 'string') return profileOrId;
  return String(profileOrId.userId || profileOrId.$id || '').trim();
}

function buildDocumentPermissions({ readUserIds = [], writeUserIds = [] } = {}) {
  const readPermissions = new Set([Permission.read(Role.users())]);
  readUserIds.filter(Boolean).forEach((userId) => readPermissions.add(Permission.read(Role.user(userId))));

  const writePermissions = new Set();
  writeUserIds.filter(Boolean).forEach((userId) => {
    writePermissions.add(Permission.update(Role.user(userId)));
    writePermissions.add(Permission.delete(Role.user(userId)));
  });

  return [...readPermissions, ...writePermissions];
}

async function safeUpdateDocument(collectionId, documentId, payload) {
  if (!collectionId || !documentId) return null;
  try {
    return await databases.updateDocument(DATABASE_ID, collectionId, documentId, payload);
  } catch (_) {
    return null;
  }
}

async function fetchCreatorsMap() {
  const currentProfile = getCurrentProfile();
  const documents = await safeListDocuments(CREATORS_COLLECTION, [Query.limit(50)]);
  const merged = [...documents];

  DEMO_CREATORS.forEach((creator) => {
    if (!merged.find((entry) => entry.$id === creator.$id)) merged.push(creator);
  });

  if (currentProfile && !merged.find((entry) => entry.$id === currentProfile.$id)) {
    merged.unshift(currentProfile);
  }

  return merged.reduce((map, creator) => {
    map.set(creator.$id, { ...creator, avatarUrl: buildAvatarUrl(creator) });
    return map;
  }, new Map());
}

function normalizePost(post, creatorsMap) {
  const reactions = getReactions();
  const author = creatorsMap.get(post.authorId) || creatorsMap.get(post.userId) || DEMO_CREATORS[0];
  const reaction = reactions[post.$id] || {};
  const mediaType = post.mediaType || (post.videoFileId ? 'video' : post.imageFileId ? 'image' : 'text');

  return {
    ...post,
    author,
    mediaType,
    mediaUrl: buildPostMedia({ ...post, mediaType }),
    likeCount: Number(post.likeCount || post.applaudCount || 0),
    commentCount: Number(post.commentCount || 0),
    shareCount: Number(post.shareCount || 0),
    saveCount: Number(post.saveCount || 0),
    liked: Boolean(reaction.liked),
    saved: Boolean(reaction.saved)
  };
}

function normalizeDeal(deal, creatorsMap) {
  const currentProfile = getCurrentProfile();
  const participantIds = Array.isArray(deal.participantIds)
    ? deal.participantIds
    : [deal.ownerId, deal.targetProfileId].filter(Boolean);
  const counterpartId = participantIds.find((entry) => entry && entry !== currentProfile?.$id) || deal.targetProfileId || deal.ownerId;
  const counterpart = creatorsMap.get(counterpartId) || DEMO_CREATORS[0];

  return {
    ...deal,
    participantIds,
    counterpart,
    latestMessage: deal.latestMessage || deal.summary || 'Start the conversation',
    status: deal.status || 'pending',
    intent: deal.intent || 'message'
  };
}

function createLocalNotification(notification) {
  const notifications = loadCache(CACHE_KEYS.notifications, []);
  saveCache(CACHE_KEYS.notifications, upsertById(notifications, notification));
}

export async function listFeedPosts() {
  const creatorsMap = await fetchCreatorsMap();
  const remotePosts = await safeListDocuments(POSTS_COLLECTION, [
    Query.orderDesc('createdAt'),
    Query.limit(30)
  ]);
  const localPosts = loadCache(CACHE_KEYS.posts, []);
  const merged = [...localPosts];

  remotePosts.forEach((post) => {
    if (!merged.find((entry) => entry.$id === post.$id)) merged.push(post);
  });

  if (merged.length === 0) {
    DEMO_POSTS.forEach((post) => merged.push(post));
  }

  return merged
    .sort((a, b) => new Date(b.createdAt || b.$createdAt || 0) - new Date(a.createdAt || a.$createdAt || 0))
    .map((post) => normalizePost(post, creatorsMap));
}

export async function createPost({ caption, file }) {
  const profile = getCurrentProfile();
  if (!profile) {
    throw new Error('Complete onboarding before posting.');
  }

  const text = String(caption || '').trim();
  if (!text && !file) {
    throw new Error('Add a caption or media to publish your post.');
  }

  let uploadedMedia = null;
  if (file) {
    const uploadedFile = await storage.createFile(MEDIA_BUCKET, ID.unique(), file);
    uploadedMedia = {
      fileId: uploadedFile.$id,
      mediaType: file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file',
      mediaBucket: MEDIA_BUCKET
    };
  }

  const createdAt = new Date().toISOString();
  const basePayload = {
    authorId: profile.$id,
    contentText: text,
    category: profile.primaryCraft || profile.role || 'Creator',
    createdAt
  };

  const richPayload = {
    ...basePayload,
    mediaFileId: uploadedMedia?.fileId || '',
    mediaType: uploadedMedia?.mediaType || 'text',
    mediaBucket: uploadedMedia?.mediaBucket || MEDIA_BUCKET,
    imageFileId: uploadedMedia?.mediaType === 'image' ? uploadedMedia.fileId : '',
    videoFileId: uploadedMedia?.mediaType === 'video' ? uploadedMedia.fileId : ''
  };

  const ownerUserId = asUserId(profile);
  const remoteDocument =
    await databases.createDocument(
      DATABASE_ID,
      POSTS_COLLECTION,
      ID.unique(),
      richPayload,
      buildDocumentPermissions({ readUserIds: [ownerUserId], writeUserIds: [ownerUserId] })
    ).catch(() => null) ||
    await databases.createDocument(
      DATABASE_ID,
      POSTS_COLLECTION,
      ID.unique(),
      {
        ...basePayload,
        content: text,
        creatorId: profile.$id,
        mediaFileId: uploadedMedia?.fileId || '',
        likeCount: 0
      },
      buildDocumentPermissions({ readUserIds: [ownerUserId], writeUserIds: [ownerUserId] })
    ).catch(() => null) ||
    await safeCreateDocument(POSTS_COLLECTION, {
      ...basePayload,
      videoFileId: uploadedMedia?.fileId || ''
    }) ||
    await safeCreateDocument(POSTS_COLLECTION, basePayload);

  const localPost = {
    $id: remoteDocument?.$id || `local_post_${Date.now()}`,
    ...richPayload,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    saveCount: 0
  };

  const cached = loadCache(CACHE_KEYS.posts, []);
  saveCache(CACHE_KEYS.posts, upsertById(cached, localPost));

  createLocalNotification({
    $id: `notif_post_${localPost.$id}`,
    userId: profile.$id,
    type: 'post',
    text: 'Your new post is live on the feed.',
    ctaLabel: 'View post',
    ctaRoute: 'feed',
    isRead: false,
    createdAt
  });

  return localPost;
}

export function togglePostReaction(postId, reactionType) {
  const reactions = getReactions();
  const current = reactions[postId] || {};
  current[reactionType] = !current[reactionType];
  reactions[postId] = current;
  saveReactions(reactions);
  return current;
}

export async function listExploreCreators(search = '') {
  const creatorsMap = await fetchCreatorsMap();
  const query = String(search || '').trim().toLowerCase();
  return Array.from(creatorsMap.values())
    .filter((creator) => creator.$id !== getCurrentProfile()?.$id)
    .filter((creator) => {
      if (!query) return true;
      return [creator.name, creator.primaryCraft, creator.city, creator.bio]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query));
    });
}

export async function getProfileById(profileId) {
  const currentProfile = getCurrentProfile();
  if (currentProfile?.$id === profileId) return currentProfile;

  const creatorsMap = await fetchCreatorsMap();
  return creatorsMap.get(profileId) || null;
}

export async function listProfilePosts(profileId) {
  const posts = await listFeedPosts();
  return posts.filter((post) => post.authorId === profileId);
}

export async function listNotifications() {
  const currentProfile = getCurrentProfile();
  if (!currentProfile) return [];

  const remoteNotifications = await safeListDocuments(NOTIFICATIONS_COLLECTION, [
    Query.equal('userId', currentProfile.$id),
    Query.orderDesc('createdAt'),
    Query.limit(30)
  ]);
  const localNotifications = loadCache(CACHE_KEYS.notifications, []);
  const merged = [...localNotifications.filter((item) => item.userId === currentProfile.$id)];

  remoteNotifications.forEach((notification) => {
    if (!merged.find((entry) => entry.$id === notification.$id)) merged.push(notification);
  });

  if (merged.length === 0) {
    merged.push(
      {
        $id: 'demo_notif_1',
        userId: currentProfile.$id,
        type: 'welcome',
        text: 'Your beta workspace is ready. Publish your first update to introduce yourself.',
        ctaLabel: 'Create post',
        ctaRoute: 'composer',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        $id: 'demo_notif_2',
        userId: currentProfile.$id,
        type: 'explore',
        text: 'Explore is surfacing three new creators near your city.',
        ctaLabel: 'Explore',
        ctaRoute: 'explore',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      }
    );
  }

  return merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function markNotificationsRead(notificationIds) {
  const nextIds = new Set(notificationIds);
  const localNotifications = loadCache(CACHE_KEYS.notifications, []);
  saveCache(CACHE_KEYS.notifications, localNotifications.map((notification) => (
    nextIds.has(notification.$id) ? { ...notification, isRead: true } : notification
  )));

  await Promise.allSettled(
    [...nextIds].map((notificationId) => safeUpdateDocument(NOTIFICATIONS_COLLECTION, notificationId, { isRead: true }))
  );
}

async function listRemoteDealsForCurrentProfile() {
  const profile = getCurrentProfile();
  if (!profile || !DEALS_COLLECTION) return [];

  const directDeals = await safeListDocuments(DEALS_COLLECTION, [
    Query.limit(50),
    Query.orderDesc('updatedAt')
  ]);

  return directDeals.filter((deal) => {
    const participants = Array.isArray(deal.participantIds) ? deal.participantIds : [deal.ownerId, deal.targetProfileId];
    return participants.includes(profile.$id);
  });
}

export async function listDeals() {
  const creatorsMap = await fetchCreatorsMap();
  const remoteDeals = await listRemoteDealsForCurrentProfile();
  const localDeals = loadCache(CACHE_KEYS.deals, []);
  const merged = [...localDeals];

  remoteDeals.forEach((deal) => {
    if (!merged.find((entry) => entry.$id === deal.$id)) merged.push(deal);
  });

  return merged
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    .map((deal) => normalizeDeal(deal, creatorsMap));
}

export async function createDeal({ targetProfileId, intent = 'message', note = '' }) {
  const profile = getCurrentProfile();
  if (!profile) throw new Error('You need a profile before starting a deal.');
  if (!targetProfileId) throw new Error('Choose a creator to continue.');

  const existingDeals = await listDeals();
  const existingDeal = existingDeals.find((deal) => deal.counterpart?.$id === targetProfileId && !['completed', 'rejected'].includes(deal.status));
  if (existingDeal) return existingDeal;

  const createdAt = new Date().toISOString();
  const ownerUserId = asUserId(profile);
  const targetUserId = asUserId(targetProfileId);
  const payload = {
    ownerId: profile.$id,
    targetProfileId,
    participantIds: [profile.$id, targetProfileId],
    intent,
    status: intent === 'message' ? 'active' : 'pending',
    summary: note || `${intent === 'hire' ? 'Hiring' : intent === 'collaborate' ? 'Collaboration' : 'Conversation'} started`,
    latestMessage: note || `Opened a ${intent} thread`,
    updatedAt: createdAt,
    createdAt
  };

  const remoteDeal =
    await databases.createDocument(
      DATABASE_ID,
      DEALS_COLLECTION,
      ID.unique(),
      payload,
      buildDocumentPermissions({ readUserIds: [ownerUserId, targetUserId], writeUserIds: [ownerUserId, targetUserId] })
    ).catch(() => null) ||
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CONVERSATIONS || COLLECTIONS.conversations,
      ID.unique(),
      payload,
      buildDocumentPermissions({ readUserIds: [ownerUserId, targetUserId], writeUserIds: [ownerUserId, targetUserId] })
    ).catch(() => null) ||
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CONTRACTS || COLLECTIONS.contracts,
      ID.unique(),
      payload,
      buildDocumentPermissions({ readUserIds: [ownerUserId, targetUserId], writeUserIds: [ownerUserId, targetUserId] })
    ).catch(() => null);

  const localDeal = {
    $id: remoteDeal?.$id || `local_deal_${Date.now()}`,
    ...payload
  };

  const cachedDeals = loadCache(CACHE_KEYS.deals, []);
  saveCache(CACHE_KEYS.deals, upsertById(cachedDeals, localDeal));

  const counterpart = await getProfileById(targetProfileId);
  await sendMessage(localDeal.$id, note || `Hi ${counterpart?.name?.split(' ')[0] || 'there'}, I would love to ${intent === 'hire' ? 'hire you for a project' : intent === 'collaborate' ? 'explore a collaboration' : 'connect with you'}.`, { authorId: profile.$id });

  createLocalNotification({
    $id: `notif_deal_${localDeal.$id}`,
    userId: profile.$id,
    type: 'deal',
    text: `${intent === 'hire' ? 'Hiring thread' : intent === 'collaborate' ? 'Collaboration thread' : 'Conversation'} created with ${counterpart?.name || 'creator'}.`,
    ctaLabel: 'Open deal room',
    ctaRoute: 'deal-room',
    isRead: false,
    createdAt
  });

  return normalizeDeal(localDeal, await fetchCreatorsMap());
}

export async function listMessages(dealId) {
  const remoteMessages = await safeListDocuments(MESSAGES_COLLECTION, [
    Query.orderAsc('$createdAt'),
    Query.limit(100)
  ]);
  const localMessages = loadCache(CACHE_KEYS.messages, []);
  const merged = [...localMessages.filter((message) => message.dealId === dealId)];

  remoteMessages
    .filter((message) => message.dealId === dealId || message.conversationId === dealId)
    .forEach((message) => {
      if (!merged.find((entry) => entry.$id === message.$id)) {
        merged.push({
          ...message,
          text: message.text || message.content || '',
          type: message.type || message.messageType || 'text',
          createdAt: message.createdAt || message.$createdAt
        });
      }
    });

  return merged.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
}

export async function sendMessage(dealId, text, options = {}) {
  const profile = getCurrentProfile();
  const senderId = options.authorId || profile?.$id;
  const content = String(text || '').trim();
  if (!dealId || !content) return null;

  const createdAt = new Date().toISOString();
  const payload = {
    dealId,
    conversationId: dealId,
    senderId,
    text: content,
    content,
    type: options.type || 'text',
    messageType: options.type || 'text',
    createdAt
  };

  const deal = loadCache(CACHE_KEYS.deals, []).find((entry) => entry.$id === dealId);
  const readUserIds = Array.isArray(deal?.participantIds) ? deal.participantIds.map((entry) => asUserId(entry)) : [asUserId(profile)];
  const remoteMessage = options.localOnly
    ? null
    : await databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION,
        ID.unique(),
        {
          dealId: payload.dealId,
          conversationId: payload.conversationId,
          senderId: payload.senderId,
          content: payload.content,
          messageType: payload.messageType
        },
        buildDocumentPermissions({ readUserIds, writeUserIds: [asUserId(senderId)] })
      ).catch(() => null);
  const localMessage = {
    $id: remoteMessage?.$id || `local_message_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...payload
  };

  const cachedMessages = loadCache(CACHE_KEYS.messages, []);
  saveCache(CACHE_KEYS.messages, upsertById(cachedMessages, localMessage));

  const cachedDeals = loadCache(CACHE_KEYS.deals, []);
  const targetDeal = cachedDeals.find((deal) => deal.$id === dealId);
  if (targetDeal) {
    const nextDeal = { ...targetDeal, latestMessage: content, updatedAt: createdAt };
    saveCache(CACHE_KEYS.deals, upsertById(cachedDeals, nextDeal));
    await safeUpdateDocument(DEALS_COLLECTION, dealId, {
      latestMessage: content,
      updatedAt: createdAt
    });
  }

  return localMessage;
}

export async function createAutoReply(deal) {
  const messages = await listMessages(deal.$id);
  const incomingExists = messages.some((message) => message.senderId !== getCurrentProfile()?.$id);
  if (incomingExists) return;

  const responseText = deal.intent === 'hire'
    ? 'Thanks for reaching out. I am interested, share the scope and timeline.'
    : deal.intent === 'collaborate'
      ? 'This sounds promising. I am open to discussing the creative direction.'
      : 'Happy to connect. Tell me a bit more about what you have in mind.';

  await sendMessage(deal.$id, responseText, {
    authorId: deal.counterpart?.$id || deal.targetProfileId,
    localOnly: true
  });
}

export async function updateDealStatus(dealId, status) {
  const createdAt = new Date().toISOString();
  const cachedDeals = loadCache(CACHE_KEYS.deals, []);
  const targetDeal = cachedDeals.find((deal) => deal.$id === dealId);
  if (!targetDeal) return null;

  const updatedDeal = { ...targetDeal, status, updatedAt: createdAt };
  saveCache(CACHE_KEYS.deals, upsertById(cachedDeals, updatedDeal));
  await safeUpdateDocument(DEALS_COLLECTION, dealId, { status, updatedAt: createdAt });

  createLocalNotification({
    $id: `notif_status_${dealId}_${status}`,
    userId: getCurrentProfile()?.$id,
    type: 'deal-status',
    text: `Deal updated to ${status}.`,
    ctaLabel: 'Open deal room',
    ctaRoute: 'deal-room',
    isRead: false,
    createdAt
  });

  return updatedDeal;
}

export function getRelativeTime(value) {
  const date = new Date(value || 0);
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return date.toLocaleDateString();
}

export function getUnreadNotificationCount(notifications) {
  return notifications.filter((notification) => !notification.isRead).length;
}

export function getProfileSnapshot() {
  return getCurrentProfile();
}
