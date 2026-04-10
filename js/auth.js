import { account, databases, ID, Query, DATABASE_ID, COLLECTIONS, Permission, Role } from './appwriteClient.js';

const PROFILE_STORAGE_KEY = 'kalakar_profile_id';
const USER_STORAGE_KEY = 'kalakar_user_id';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREATORS_COLLECTION = COLLECTIONS.CREATORS || COLLECTIONS.creators;

const success = (data) => ({ success: true, data });
const failure = (message, code = 'unknown') => ({ success: false, error: { code, message } });

function normalizeError(error) {
  const code = Number(error?.code || error?.response?.status || 0);
  const type = String(error?.type || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (code === 401 && (type.includes('session') || message.includes('missing scope'))) {
    return failure('Your session has expired. Please sign in again.', 'unauthenticated');
  }

  if (code === 429 || type.includes('rate') || message.includes('too many')) {
    return failure('Too many attempts. Please wait a minute and try again.', 'rate_limited');
  }

  if (type.includes('expired') || message.includes('expired')) {
    return failure('This sign-in link has expired. Request a fresh one to continue.', 'expired_link');
  }

  if (type.includes('invalid') || message.includes('invalid')) {
    return failure('That sign-in request is no longer valid. Please try again.', 'invalid_link');
  }

  return failure(error?.message || 'Something went wrong. Please try again.', code || 'unknown');
}

function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function persistProfileId(profileId) {
  if (!profileId || typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, String(profileId));
}

function clearProfileId() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem('kalakar_user_profile');
}

function getPersistedProfileId() {
  if (typeof window === 'undefined') return '';
  return String(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '').trim();
}

function persistUser(userId) {
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.setItem(USER_STORAGE_KEY, String(userId));
}

function sanitizeProfile(profileData = {}, user = {}) {
  const fullName = String(profileData.name || user.name || '').trim();
  const safeName = fullName || 'Kalakar Creator';
  const usernameBase = String(profileData.username || safeName.toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(/^_+|_+$/g, '');

  return {
    userId: String(user.$id || '').trim(),
    name: safeName,
    username: usernameBase || `creator_${String(user.$id || '').slice(-6)}`,
    primaryCraft: String(profileData.primaryCraft || profileData.role || 'Creator').trim(),
    role: String(profileData.primaryCraft || profileData.role || 'Creator').trim(),
    city: String(profileData.city || 'Mumbai').trim(),
    bio: String(profileData.bio || '').trim(),
    language: String(profileData.language || 'English').trim(),
    avatarFileId: String(profileData.avatarFileId || '').trim(),
    reelFileId: String(profileData.reelFileId || '').trim(),
    accountType: String(profileData.accountType || 'talent').trim(),
    yearsExperience: Number(profileData.yearsExperience || 0),
    isVerified: false,
    createdAt: new Date().toISOString()
  };
}

async function findProfileForUser(userId) {
  if (!userId) return null;

  try {
    return await databases.getDocument(DATABASE_ID, CREATORS_COLLECTION, userId);
  } catch (_) {}

  try {
    const response = await databases.listDocuments(DATABASE_ID, CREATORS_COLLECTION, [
      Query.equal('userId', userId),
      Query.limit(1)
    ]);
    return response.documents[0] || null;
  } catch (_) {
    return null;
  }
}

export async function sendMagicLink(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return failure('Enter a valid email address to continue.', 'validation');
  }

  try {
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    const token = await account.createMagicURLToken(ID.unique(), normalizedEmail, redirectUrl);
    return success({
      email: normalizedEmail,
      userId: token?.userId || null
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function loginWithGoogle() {
  try {
    const successUrl = `${window.location.origin}${window.location.pathname}#feed`;
    const failureUrl = `${window.location.origin}${window.location.pathname}?authError=google`;
    account.createOAuth2Session('google', successUrl, failureUrl);
    return success({ redirecting: true });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function consumeMagicLinkSession() {
  const params = new URLSearchParams(window.location.search);
  const userId = String(params.get('userId') || '').trim();
  const secret = String(params.get('secret') || '').trim();

  if (!userId || !secret) {
    return success({ completed: false });
  }

  try {
    await account.updateMagicURLSession(userId, secret);
    const nextUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || '#feed'}`;
    window.history.replaceState({}, '', nextUrl);
    return success({ completed: true });
  } catch (error) {
    const result = normalizeError(error);
    const nextUrl = `${window.location.origin}${window.location.pathname}?authError=magic-link`;
    window.history.replaceState({}, '', nextUrl);
    return result;
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();
    persistUser(user.$id);
    return success(user);
  } catch (error) {
    return normalizeError(error);
  }
}

export async function getCreatorProfile(userId) {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    return failure('Missing user context for profile lookup.', 'validation');
  }

  try {
    const persistedId = getPersistedProfileId();
    if (persistedId) {
      try {
        const cached = await databases.getDocument(DATABASE_ID, CREATORS_COLLECTION, persistedId);
        persistProfileId(cached.$id);
        return success(cached);
      } catch (_) {}
    }

    const profile = await findProfileForUser(normalizedUserId);
    if (!profile) {
      return failure('Creator profile not found.', 'missing_profile');
    }

    persistProfileId(profile.$id);
    return success(profile);
  } catch (error) {
    return normalizeError(error);
  }
}

export async function createCreatorProfile(profileData = {}) {
  try {
    const user = await account.get();
    const payload = sanitizeProfile(profileData, user);
    const existingProfile = await findProfileForUser(user.$id);
    const permissions = [
      Permission.read(Role.users()),
      Permission.update(Role.user(user.$id)),
      Permission.delete(Role.user(user.$id))
    ];

    const profile = existingProfile
      ? await databases.updateDocument(DATABASE_ID, CREATORS_COLLECTION, existingProfile.$id, payload)
      : await databases.createDocument(DATABASE_ID, CREATORS_COLLECTION, user.$id, payload, permissions);

    persistProfileId(profile.$id);
    persistUser(user.$id);
    return success(profile);
  } catch (error) {
    return normalizeError(error);
  }
}

export async function logout() {
  try {
    await account.deleteSession('current');
  } catch (_) {}

  clearProfileId();
  return success({ loggedOut: true });
}

export function getStoredProfileSnapshot() {
  if (typeof window === 'undefined') return null;
  return safeParseJson(window.localStorage.getItem('kalakar_user_profile') || '') || null;
}
