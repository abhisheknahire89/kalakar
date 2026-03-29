import { Client, Databases, Storage, Account, ID, Query } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c8ee1b0037e381d046');

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);
export { ID, Query };

// Expose globally for legacy scripts
window.appwriteClient = {
    client, databases, storage, account
};

export const APPWRITE_CONFIG = {
  databaseId: 'kalakar_db',
  buckets: {
    avatars: 'avatars',
    resumes: 'resumes',
    reels: 'reels',
    post_media: 'post_media',
    attachments: 'attachments',
    contracts: 'contracts',
    reports: 'reports'
  },
  collections: {
    creators:         'creators', // Renamed from profiles
    studios:          'studios',
    posts:            'posts',
    comments:         'comments',
    applauds:         'applauds',
    connections:      'connections',
    vouches:          'vouches',
    credits:          'credits',
    jobs:             'jobs',
    applications:     'applications',
    conversations:    'conversations',
    messages:         'messages',
    contracts:        'contracts',
    notifications:    'notifications',
    weeklyPrompts:   'weeklyPrompts',
    savedItems:      'savedItems',
    jobAlertPrefs:  'jobAlertPreferences',
  }
};

export default client;
