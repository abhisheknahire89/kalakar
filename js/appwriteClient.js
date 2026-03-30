import { Client, Account, Databases, Storage, ID, Query } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm';

export const APPWRITE_CONFIG = {
  ENDPOINT: 'https://fra.cloud.appwrite.io/v1',
  PROJECT_ID: '69c8ee1b0037e381d046',
  DATABASE_ID: 'kalakar_db',
  COLLECTIONS: {
    CREATORS: 'creators',
    POSTS: 'posts',
    CONNECTIONS: 'connections',
    CREDITS: 'credits',
    VOUCHES: 'vouches',
    JOBS: 'jobs',
    APPLICATIONS: 'applications',
    NOTIFICATIONS: 'notifications',
    CONVERSATIONS: 'conversations',
    MESSAGES: 'messages',
    CONTRACTS: 'contracts',
    creators: 'creators',
    posts: 'posts',
    connections: 'connections',
    credits: 'credits',
    vouches: 'vouches',
    jobs: 'jobs',
    applications: 'applications',
    notifications: 'notifications',
    conversations: 'conversations',
    messages: 'messages',
    contracts: 'contracts'
  },
  BUCKETS: {
    AVATARS: 'avatars',
    POST_MEDIA: 'post_media',
    REELS: 'reels',
    avatars: 'avatars',
    post_media: 'post_media',
    reels: 'reels'
  },
  // Backward-compatible keys used by older modules
  databaseId: 'kalakar_db',
  collections: {
    creators: 'creators',
    posts: 'posts',
    connections: 'connections',
    credits: 'credits',
    applications: 'applications',
    jobs: 'jobs'
  },
  buckets: {
    avatars: 'avatars',
    post_media: 'post_media',
    reels: 'reels'
  }
};

export const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
export const COLLECTIONS = APPWRITE_CONFIG.COLLECTIONS;
export const BUCKETS = APPWRITE_CONFIG.BUCKETS;

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
  .setProject(APPWRITE_CONFIG.PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query, client };
