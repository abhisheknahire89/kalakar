import { account, databases, ID, DATABASE_ID, COLLECTIONS } from './appwriteClient.js';
import { Query } from './appwriteClient.js';

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const OTP_REGEX = /^\d{6}$/;
const PROFILE_ID_STORAGE_KEY = 'kalakar_profile_id';

const buildSuccess = (data) => ({ success: true, data });
const buildError = (error) => ({ success: false, error });

function mapAuthError(error) {
  const code = Number(error?.code ?? error?.response?.status ?? 0);
  const type = String(error?.type ?? '').toLowerCase();
  const message = String(error?.message ?? '').toLowerCase();

  if (code === 429 || type.includes('rate_limit') || message.includes('too many')) {
    return 'Rate limit exceeded. Please wait and try again.';
  }

  if (code === 401 && (type.includes('token_expired') || message.includes('expired'))) {
    return 'OTP expired. Please request a new code.';
  }

  if (code === 401 && (type.includes('invalid') || message.includes('invalid'))) {
    return 'Invalid OTP. Please try again.';
  }

  if (code === 401 || code === 403) {
    return 'Authentication failed. Please try again.';
  }

  return error?.message || 'Something went wrong. Please try again.';
}

function normalizePhone(phone) {
  if (typeof phone !== 'string') return '';
  return phone.trim().replace(/\s+/g, '');
}

export async function sendPhoneOTP(phone) {
  try {
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return buildError('Phone number is required.');
    }

    if (!PHONE_REGEX.test(normalizedPhone)) {
      return buildError('Phone number must be in E.164 format (e.g. +919876543210).');
    }

    const token = await account.createPhoneToken(ID.unique(), normalizedPhone);

    return buildSuccess({
      userId: token?.userId || null,
      phone: normalizedPhone
    });
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

export async function verifyPhoneOTP(userId, otp) {
  try {
    const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
    const normalizedOtp = typeof otp === 'string' ? otp.trim() : '';

    if (!normalizedUserId) {
      return buildError('User ID is required.');
    }

    if (!OTP_REGEX.test(normalizedOtp)) {
      return buildError('OTP must be 6 digits.');
    }

    const session = await account.createSession(normalizedUserId, normalizedOtp);

    return buildSuccess({
      sessionId: session?.$id || null,
      userId: session?.userId || normalizedUserId,
      expire: session?.expire || null
    });
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

export async function loginWithGoogle() {
  try {
    const successUrl = `${window.location.origin}${window.location.pathname}`;
    const failureUrl = `${window.location.origin}${window.location.pathname}?authError=google`;

    await account.createOAuth2Session('google', successUrl, failureUrl);

    return buildSuccess({ redirecting: true, provider: 'google' });
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

export async function getCurrentUser() {
  try {
    const user = await account.get();
    return buildSuccess(user);
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

export async function getCreatorProfile() {
  try {
    const databaseId = DATABASE_ID;
    const creatorsCollection = COLLECTIONS.CREATORS || COLLECTIONS.creators;

    if (!databaseId || !creatorsCollection) {
      return buildError('Creator profile configuration is missing.');
    }

    const user = await account.get();
    const persistedProfileId = getPersistedProfileId();

    if (persistedProfileId) {
      try {
        const profile = await databases.getDocument(databaseId, creatorsCollection, persistedProfileId);
        return buildSuccess(profile);
      } catch (_) {}
    }

    let response = { documents: [] };
    try {
      response = await databases.listDocuments(databaseId, creatorsCollection, [
        Query.equal('username', [`user_${String(user.$id || '').slice(-6)}`]),
        Query.limit(1)
      ]);
    } catch (_) {
      response = { documents: [] };
    }

    if (!Array.isArray(response?.documents) || response.documents.length === 0) {
      response = await databases.listDocuments(databaseId, creatorsCollection, [
        Query.orderDesc('$createdAt'),
        Query.limit(1)
      ]);
    }

    const profile = Array.isArray(response?.documents) && response.documents.length > 0
      ? response.documents[0]
      : null;

    if (!profile) {
      return buildError('Creator profile not found.');
    }

    persistProfileId(profile.$id);
    return buildSuccess(profile);
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

export async function logout() {
  try {
    await account.deleteSession('current');
    return buildSuccess({ loggedOut: true });
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

// Backward-compatible onboarding helper used by legacy views
export async function createCreatorProfile(profileData = {}) {
  try {
    const user = await account.get();
    const databaseId = DATABASE_ID;
    const creatorsCollection = COLLECTIONS.CREATORS || COLLECTIONS.creators;

    if (!databaseId || !creatorsCollection) {
      return buildError('Creator profile configuration is missing.');
    }

    const payload = {
      name: String(profileData.name || user.name || '').trim(),
      username: String(profileData.username || `user_${user.$id?.slice(-6) || 'creator'}`).trim(),
      bio: String(profileData.bio || '').trim(),
      avatarFileId: String(profileData.avatarFileId || '').trim(),
      city: String(profileData.city || 'Mumbai').trim(),
      language: String(profileData.language || 'Marathi').trim(),
      isVerified: false,
      createdAt: new Date().toISOString()
    };

    let doc;
    const existingProfileId = getPersistedProfileId();
    if (existingProfileId) {
      try {
        doc = await databases.updateDocument(databaseId, creatorsCollection, existingProfileId, payload);
      } catch (_) {
        doc = null;
      }
    }

    if (!doc) {
      doc = await databases.createDocument(databaseId, creatorsCollection, ID.unique(), payload);
    }

    persistProfileId(doc.$id);

    return buildSuccess({ profile: doc });
  } catch (error) {
    return buildError(mapAuthError(error));
  }
}

function getPersistedProfileId() {
  if (typeof window === 'undefined' || !window.localStorage) return '';
  return String(window.localStorage.getItem(PROFILE_ID_STORAGE_KEY) || '').trim();
}

function persistProfileId(profileId) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!profileId) return;
  window.localStorage.setItem(PROFILE_ID_STORAGE_KEY, String(profileId));
}
