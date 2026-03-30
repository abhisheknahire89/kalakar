import { Client, Databases, Storage, Permission, Role, ID, Query } from 'node-appwrite';

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
  { id: 'creators', name: 'Creators' },
  { id: 'posts', name: 'Posts' },
  { id: 'jobs', name: 'Jobs' },
  { id: 'applications', name: 'Applications' },
  { id: 'vouches', name: 'Vouches' },
  { id: 'messages', name: 'Messages' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'weeklyPrompts', name: 'Weekly Prompts' }
];

async function init() {
  console.log('Appwrite Initialization & Seeding Started...');
  
  // 1. Database
  try {
    await databases.create(DATABASE_DEFAULT_ID, 'Kalakar Database');
    console.log(`✅ Database created`);
  } catch (err) {
    if (err.code !== 409) console.error(`❌ DB error:`, err.message);
  }

  // 2. Collections & Attributes
  for (const col of COLLECTIONS) {
    try {
      await databases.createCollection(DATABASE_DEFAULT_ID, col.id, col.name, [Permission.read(Role.any()), Permission.write(Role.users())]);
      console.log(`✅ Collection created: ${col.id}`);
    } catch (err) {
      if (err.code !== 409) console.error(`❌ Collection ${col.id} error:`, err.message);
    }
  }

  // Attributes for 'creators'
  const creatorAttrs = [
    { key: 'userId', type: 'string', size: 255, required: true },
    { key: 'name', type: 'string', size: 255, required: true },
    { key: 'primaryCraft', type: 'string', size: 255, required: false },
    { key: 'city', type: 'string', size: 255, required: false },
    { key: 'vouchCount', type: 'integer', required: false, default: 0 },
    { key: 'isVerified', type: 'boolean', required: false, default: false }
  ];

  for (const attr of creatorAttrs) {
      try {
          if (attr.type === 'string') await databases.createStringAttribute(DATABASE_DEFAULT_ID, 'creators', attr.key, attr.size, attr.required);
          if (attr.type === 'integer') await databases.createIntegerAttribute(DATABASE_DEFAULT_ID, 'creators', attr.key, attr.required, 0, 1000000, attr.default);
          if (attr.type === 'boolean') await databases.createBooleanAttribute(DATABASE_DEFAULT_ID, 'creators', attr.key, attr.required, attr.default);
      } catch (e) {}
  }

  // Attributes for 'posts'
  const postAttrs = [
    { key: 'authorId', type: 'string', size: 255, required: true },
    { key: 'contentText', type: 'string', size: 5000, required: false },
    { key: 'category', type: 'string', size: 255, required: false },
    { key: 'createdAt', type: 'string', size: 255, required: false }
  ];

  for (const attr of postAttrs) {
    try {
        await databases.createStringAttribute(DATABASE_DEFAULT_ID, 'posts', attr.key, attr.size, attr.required);
    } catch (e) {}
  }

  // 3. SEED DATA
  console.log('\n--- Seeding Data ---');
  
  const seedCreators = [
    { $id: 'ishaan_123', userId: 'user_ishaan', name: 'Ishaan Verma', primaryCraft: 'Actor/Dancer', city: 'Mumbai', vouchCount: 45, isVerified: true },
    { $id: 'alisha_456', userId: 'user_alisha', name: 'Alisha Rao', primaryCraft: 'Cinematographer', city: 'Pune', vouchCount: 22, isVerified: true }
  ];

  for (const c of seedCreators) {
    try {
        await databases.createDocument(DATABASE_DEFAULT_ID, 'creators', c.$id, c);
        console.log(`✅ Seeded Creator: ${c.name}`);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  }

  const seedPosts = [
    { authorId: 'ishaan_123', contentText: 'Just wrapped a high-octane dance sequence for an upcoming OTT series! #dance #bollywood', category: 'actor', createdAt: new Date().toISOString() },
    { authorId: 'alisha_456', contentText: 'Testing the new Alexa 35 in low light. The dynamic range is insane. #cinematography #camera', category: 'cinematographer', createdAt: new Date().toISOString() }
  ];

  for (const p of seedPosts) {
    try {
        await databases.createDocument(DATABASE_DEFAULT_ID, 'posts', ID.unique(), p);
        console.log(`✅ Seeded Post`);
    } catch (e) { console.error(e.message); }
  }

  console.log('\n🎉 Finished!');
}

init();
