import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm';

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '69c8ee1b0037e381d046';
const DATABASE_ID = 'kalakar_db';

const COLLECTIONS = {
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
  DEALS: 'deals',
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
  deals: 'deals',
  contracts: 'contracts'
};

const BUCKETS = {
  AVATARS: 'avatars',
  POST_MEDIA: 'avatars',
  REELS: 'avatars',
  avatars: 'avatars',
  post_media: 'avatars',
  reels: 'avatars'
};

const APPWRITE_CONFIG = {
  ENDPOINT,
  PROJECT_ID,
  DATABASE_ID,
  COLLECTIONS,
  BUCKETS,
  databaseId: DATABASE_ID,
  collections: {
    creators: COLLECTIONS.creators,
    posts: COLLECTIONS.posts,
    connections: COLLECTIONS.connections,
    credits: COLLECTIONS.credits,
    jobs: COLLECTIONS.jobs,
    applications: COLLECTIONS.applications,
    notifications: COLLECTIONS.notifications,
    conversations: COLLECTIONS.conversations,
    messages: COLLECTIONS.messages,
    deals: COLLECTIONS.deals,
    contracts: COLLECTIONS.contracts
  },
  buckets: {
    avatars: BUCKETS.avatars,
    post_media: BUCKETS.post_media,
    reels: BUCKETS.reels
  }
};

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

function buildFileUrl(bucketId, fileId, mode = 'view') {
  if (!bucketId || !fileId) return '';
  const safeBucket = encodeURIComponent(bucketId);
  const safeFile = encodeURIComponent(fileId);
  return `${ENDPOINT}/storage/buckets/${safeBucket}/files/${safeFile}/${mode}?project=${PROJECT_ID}`;
}

function getFilePreviewUrl(bucketId, fileId) {
  return buildFileUrl(bucketId, fileId, 'preview');
}

function getFileViewUrl(bucketId, fileId) {
  return buildFileUrl(bucketId, fileId, 'view');
}

export {
  APPWRITE_CONFIG,
  ENDPOINT,
  PROJECT_ID,
  DATABASE_ID,
  COLLECTIONS,
  BUCKETS,
  account,
  databases,
  storage,
  client,
  ID,
  Query,
  Permission,
  Role,
  getFilePreviewUrl,
  getFileViewUrl
};

export default client;
