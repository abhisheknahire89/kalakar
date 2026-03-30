import { account, databases, ID, Query, APPWRITE_CONFIG } from './appwriteClient.js';

// ═══════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════

/**
 * Check if user has an active session
 */
export async function getCurrentUser() {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has a creator profile (onboarded)
 */
export async function getCreatorProfile(userId) {
  try {
    const result = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.creators,
      [Query.equal('userId', userId), Query.limit(1)]
    );
    return result.documents.length > 0 ? result.documents[0] : null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    await account.deleteSession('current');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════
// PHONE OTP AUTHENTICATION
// ═══════════════════════════════════

export async function sendPhoneOTP(phone) {
  try {
    const token = await account.createPhoneToken(ID.unique(), phone);
    return { success: true, userId: token.userId };
  } catch (error) {
    console.error('Send OTP error:', error);
    if (error.code === 429) return { success: false, error: 'Too many attempts. Wait 60s.' };
    return { success: false, error: 'Failed to send OTP. Check number.' };
  }
}

export async function verifyPhoneOTP(userId, otp) {
  try {
    const session = await account.createSession(userId, otp);
    return { success: true, session };
  } catch (error) {
    console.error('Verify OTP error:', error);
    if (error.code === 401) return { success: false, error: 'Invalid OTP code.' };
    return { success: false, error: 'Verification failed.' };
  }
}

// ═══════════════════════════════════
// GOOGLE OAuth 2.0
// ═══════════════════════════════════

export function loginWithGoogle() {
  try {
    account.createOAuth2Session(
      'google',
      window.location.origin + '/#stage',
      window.location.origin + '/#login',
      ['openid', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
    );
  } catch (error) {
    console.error('Google login error:', error);
  }
}

// ═══════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════

export async function createCreatorProfile(profileData) {
  try {
    const user = await account.get();
    const profile = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.creators,
      ID.unique(),
      {
        userId: user.$id,
        name: profileData.name || user.name || '',
        role: profileData.primaryCraft || 'actor',
        city: profileData.city || 'Mumbai',
        verified: false,
        reliability: 80,
        tags: profileData.tags || [],
        credits: [],
        vouchedBy: 'System',
        createdAt: new Date().toISOString()
      }
    );
    return { success: true, profile };
  } catch (error) {
    console.error('Profile creation error:', error);
    return { success: false, error: 'Failed to save profile.' };
  }
}
