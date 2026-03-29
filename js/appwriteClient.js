import { Client, Databases, Storage, Account } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('69c8ee1b0037e381d046');

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

// Expose globally for the legacy scripts expecting window.appwriteClient
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
  }
};

export default client;
