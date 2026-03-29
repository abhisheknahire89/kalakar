import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '69c8ee1b0037e381d046';
const apiKey = 'standard_eed0746f83a459190bf12a9e8b99dedab3626888e1add06f6439f3bfa2c5e9d3a9e67305a44021f9fcb821c334e70d541914a62976466dbe6ec10db47a3a0d1ba147ce080c9021d192c0cbdfbe5c61b6935286159cc696340adc862802ef7218c140df41275e16d25a5aeab5b9073d80a6908c79f524a3bf960d9e5abe512b89';

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_DEFAULT_ID = 'kalakar_db';

const COLLECTIONS = [
  { id: 'profiles', name: 'Profiles' },
  { id: 'posts', name: 'Posts' },
  { id: 'jobs', name: 'Jobs' },
  { id: 'applications', name: 'Applications' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'escrow_milestones', name: 'Escrow Milestones' },
  { id: 'vouches', name: 'Vouches' },
  { id: 'messages', name: 'Messages' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'credits', name: 'Verified Credits' },
  { id: 'applauds', name: 'Applauds' },
  { id: 'comments', name: 'Comments' },
  { id: 'chats', name: 'Chat Rooms' },
  { id: 'agencies', name: 'Agencies' },
  { id: 'saved_items', name: 'Saved Items' },
  { id: 'settings', name: 'User Settings' },
  { id: 'reports', name: 'Reports' }
];

const BUCKETS = [
  { id: 'avatars', name: 'Profile Avatars' },
  { id: 'resumes', name: 'Resumes' },
  { id: 'reels', name: 'Video Reels' },
  { id: 'post_media', name: 'Post Media' },
  { id: 'attachments', name: 'Chat Attachments' },
  { id: 'contracts', name: 'Contract PDFs' },
  { id: 'reports', name: 'Report Files' }
];

async function init() {
  console.log('Appwrite Initialization Script Started...');
  let hasErrors = false;
  
  // 1. Database
  try {
    await databases.create(DATABASE_DEFAULT_ID, 'Kalakar Database');
    console.log(`✅ Database created: ${DATABASE_DEFAULT_ID}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`ℹ️ Database already exists: ${DATABASE_DEFAULT_ID}`);
    } else {
      console.error(`❌ Failed to create database:`, err.message);
      hasErrors = true;
    }
  }

  // 2. Collections
  console.log('\\n--- Initializing 17 Collections ---');
  for (const col of COLLECTIONS) {
    try {
      await databases.createCollection(
        DATABASE_DEFAULT_ID,
        col.id,
        col.name,
        [Permission.read(Role.any()), Permission.write(Role.users())]
      );
      console.log(`✅ Collection created: ${col.id} (${col.name})`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`ℹ️ Collection already exists: ${col.id}`);
      } else {
        console.error(`❌ Failed to create collection ${col.id}:`, err.message);
        hasErrors = true;
      }
    }
  }

  // Set minimum attributes (basic setup)
  // For 'profiles'
  try {
    await databases.createStringAttribute(DATABASE_DEFAULT_ID, 'profiles', 'name', 255, true);
    await databases.createStringAttribute(DATABASE_DEFAULT_ID, 'profiles', 'role', 255, false);
    await databases.createStringAttribute(DATABASE_DEFAULT_ID, 'profiles', 'city', 255, false);
    await databases.createBooleanAttribute(DATABASE_DEFAULT_ID, 'profiles', 'verified', false, false, false);
    console.log(`✅ Profiles Attributes added.`);
  } catch (err) {
    if (err.code !== 409) console.error(`❌ Failed profiles attributes:`, err.message);
  }

  // 3. Storage Buckets
  console.log('\\n--- Initializing 7 Storage Buckets ---');
  for (const bucket of BUCKETS) {
    try {
        await storage.createBucket(
            bucket.id,
            bucket.name,
            [Permission.read(Role.any()), Permission.write(Role.users())],
            false, // File Security
            true, // Enable Anti Virus
            [], // allowed file extensions
            0, // allow all sizes
            true, // Encryption
            true // Anti virus
        );
        console.log(`✅ Bucket created: ${bucket.id} (${bucket.name})`);
    } catch (err) {
        if (err.code === 409) {
            console.log(`ℹ️ Bucket already exists: ${bucket.id}`);
        } else {
            console.error(`❌ Failed to create bucket ${bucket.id}:`, err.message);
            hasErrors = true;
        }
    }
  }

  console.log('\\n--- Summary ---');
  if (hasErrors) {
    console.log('⚠️ Script finished with some errors. See output above.');
  } else {
    console.log('🎉 Successfully created all 17 collections and 7 buckets in Appwrite!');
  }
}

init();
