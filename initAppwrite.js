#!/usr/bin/env node

import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';

const CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || '69c8ee1b0037e381d046',
  apiKey: process.env.APPWRITE_API_KEY || '',
  databaseId: 'kalakar_db',
  databaseName: 'Kalakar Beta',
  buckets: [
    {
      id: 'avatars',
      name: 'Kalakar Uploads',
      maxFileSize: 50_000_000,
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm']
    }
  ]
};

const COLLECTION_PERMISSIONS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users())
];

const COLLECTIONS = [
  {
    id: 'creators',
    name: 'Creators',
    attributes: [
      { kind: 'string', key: 'userId', size: 64, required: true },
      { kind: 'string', key: 'name', size: 120, required: true },
      { kind: 'string', key: 'username', size: 60, required: true },
      { kind: 'string', key: 'primaryCraft', size: 80, required: false },
      { kind: 'string', key: 'role', size: 80, required: false },
      { kind: 'string', key: 'bio', size: 2000, required: false },
      { kind: 'string', key: 'avatarFileId', size: 64, required: false },
      { kind: 'string', key: 'reelFileId', size: 64, required: false },
      { kind: 'string', key: 'city', size: 80, required: false },
      { kind: 'string', key: 'language', size: 40, required: false },
      { kind: 'string', key: 'accountType', size: 40, required: false },
      { kind: 'integer', key: 'yearsExperience', required: false, min: 0, max: 80, default: 0 },
      { kind: 'boolean', key: 'isVerified', required: false, default: false },
      { kind: 'integer', key: 'vouchCount', required: false, min: 0, max: 1000000, default: 0 },
      { kind: 'integer', key: 'reliability', required: false, min: 0, max: 100, default: 80 },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'creators_userId', type: 'key', attributes: ['userId'] },
      { key: 'creators_username', type: 'key', attributes: ['username'] },
      { key: 'creators_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'posts',
    name: 'Posts',
    attributes: [
      { kind: 'string', key: 'authorId', size: 64, required: false },
      { kind: 'string', key: 'creatorId', size: 64, required: false },
      { kind: 'string', key: 'contentText', size: 5000, required: false },
      { kind: 'string', key: 'content', size: 5000, required: false },
      { kind: 'string', key: 'mediaFileId', size: 64, required: false },
      { kind: 'string', key: 'mediaType', size: 24, required: false },
      { kind: 'string', key: 'mediaBucket', size: 64, required: false },
      { kind: 'string', key: 'imageFileId', size: 64, required: false },
      { kind: 'string', key: 'videoFileId', size: 64, required: false },
      { kind: 'string', key: 'category', size: 80, required: false },
      { kind: 'integer', key: 'likeCount', required: false, min: 0, max: 1000000000, default: 0 },
      { kind: 'integer', key: 'commentCount', required: false, min: 0, max: 1000000000, default: 0 },
      { kind: 'integer', key: 'shareCount', required: false, min: 0, max: 1000000000, default: 0 },
      { kind: 'integer', key: 'saveCount', required: false, min: 0, max: 1000000000, default: 0 },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'posts_authorId', type: 'key', attributes: ['authorId'] },
      { key: 'posts_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'connections',
    name: 'Connections',
    attributes: [
      { kind: 'string', key: 'requesterId', size: 64, required: false },
      { kind: 'string', key: 'recipientId', size: 64, required: false },
      { kind: 'string', key: 'fromUserId', size: 64, required: false },
      { kind: 'string', key: 'toUserId', size: 64, required: false },
      { kind: 'string', key: 'status', size: 40, required: true },
      { kind: 'string', key: 'note', size: 300, required: false },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'connections_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'notifications',
    name: 'Notifications',
    attributes: [
      { kind: 'string', key: 'userId', size: 64, required: true },
      { kind: 'string', key: 'type', size: 60, required: false },
      { kind: 'string', key: 'text', size: 1000, required: true },
      { kind: 'string', key: 'ctaLabel', size: 80, required: false },
      { kind: 'string', key: 'ctaRoute', size: 80, required: false },
      { kind: 'boolean', key: 'isRead', required: false, default: false },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'notifications_userId', type: 'key', attributes: ['userId'] },
      { key: 'notifications_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'deals',
    name: 'Deals',
    attributes: [
      { kind: 'string', key: 'ownerId', size: 64, required: true },
      { kind: 'string', key: 'targetProfileId', size: 64, required: true },
      { kind: 'string', key: 'participantIds', size: 64, required: false, array: true },
      { kind: 'string', key: 'intent', size: 40, required: true },
      { kind: 'string', key: 'status', size: 40, required: true },
      { kind: 'string', key: 'summary', size: 500, required: false },
      { kind: 'string', key: 'latestMessage', size: 1000, required: false },
      { kind: 'datetime', key: 'updatedAt', required: true },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'deals_ownerId', type: 'key', attributes: ['ownerId'] },
      { key: 'deals_targetProfileId', type: 'key', attributes: ['targetProfileId'] },
      { key: 'deals_updatedAt', type: 'key', attributes: ['updatedAt'], orders: ['DESC'] }
    ]
  },
  {
    id: 'messages',
    name: 'Messages',
    attributes: [
      { kind: 'string', key: 'dealId', size: 64, required: false },
      { kind: 'string', key: 'conversationId', size: 64, required: false },
      { kind: 'string', key: 'senderId', size: 64, required: true },
      { kind: 'string', key: 'content', size: 5000, required: true },
      { kind: 'string', key: 'messageType', size: 40, required: false },
      { kind: 'string', key: 'mediaFileId', size: 64, required: false },
      { kind: 'string', key: 'contractData', size: 5000, required: false }
    ],
    indexes: [
      { key: 'messages_dealId', type: 'key', attributes: ['dealId'] },
      { key: 'messages_conversationId', type: 'key', attributes: ['conversationId'] }
    ]
  },
  {
    id: 'jobs',
    name: 'Jobs',
    attributes: [
      { kind: 'string', key: 'title', size: 200, required: true },
      { kind: 'string', key: 'company', size: 120, required: false },
      { kind: 'string', key: 'type', size: 80, required: false },
      { kind: 'string', key: 'location', size: 120, required: false },
      { kind: 'string', key: 'city', size: 120, required: false },
      { kind: 'string', key: 'description', size: 5000, required: true },
      { kind: 'string', key: 'roleType', size: 80, required: false },
      { kind: 'string', key: 'experienceLevel', size: 80, required: false },
      { kind: 'string', key: 'posterId', size: 64, required: false },
      { kind: 'string', key: 'createdBy', size: 64, required: false },
      { kind: 'boolean', key: 'isUrgent', required: false, default: false },
      { kind: 'boolean', key: 'isVerified', required: false, default: false },
      { kind: 'boolean', key: 'isOpen', required: false, default: true },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'jobs_createdAt', type: 'key', attributes: ['createdAt'], orders: ['DESC'] },
      { key: 'jobs_posterId', type: 'key', attributes: ['posterId'] }
    ]
  },
  {
    id: 'applications',
    name: 'Applications',
    attributes: [
      { kind: 'string', key: 'jobId', size: 64, required: true },
      { kind: 'string', key: 'talentId', size: 64, required: false },
      { kind: 'string', key: 'applicantId', size: 64, required: false },
      { kind: 'string', key: 'note', size: 2000, required: false },
      { kind: 'string', key: 'coverNote', size: 2000, required: false },
      { kind: 'string', key: 'status', size: 40, required: true },
      { kind: 'datetime', key: 'appliedAt', required: false },
      { kind: 'datetime', key: 'createdAt', required: false }
    ],
    indexes: [
      { key: 'applications_jobId', type: 'key', attributes: ['jobId'] },
      { key: 'applications_talentId', type: 'key', attributes: ['talentId'] },
      { key: 'applications_applicantId', type: 'key', attributes: ['applicantId'] }
    ]
  },
  {
    id: 'vouches',
    name: 'Vouches',
    attributes: [
      { kind: 'string', key: 'vouchId', size: 64, required: true },
      { kind: 'string', key: 'talentId', size: 64, required: true },
      { kind: 'string', key: 'category', size: 100, required: true },
      { kind: 'string', key: 'comment', size: 1000, required: false },
      { kind: 'datetime', key: 'createdAt', required: true }
    ],
    indexes: [
      { key: 'vouches_talentId', type: 'key', attributes: ['talentId'] }
    ]
  },
  {
    id: 'credits',
    name: 'Credits',
    attributes: [
      { kind: 'string', key: 'talentId', size: 64, required: true },
      { kind: 'string', key: 'projectTitle', size: 160, required: true },
      { kind: 'string', key: 'role', size: 120, required: true },
      { kind: 'integer', key: 'year', required: false, min: 1900, max: 2100, default: 2025 },
      { kind: 'boolean', key: 'isVerified', required: false, default: false },
      { kind: 'string', key: 'verifiedBy', size: 120, required: false }
    ],
    indexes: [
      { key: 'credits_talentId', type: 'key', attributes: ['talentId'] }
    ]
  }
];

function isAlreadyExistsError(error) {
  if (!error) return false;
  const code = Number(error.code || error.response?.status || error.statusCode);
  const message = String(error.message || '').toLowerCase();
  return code === 409 || message.includes('already exists') || message.includes('duplicate');
}

function isNotReadyError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return message.includes('not yet available') || message.includes('attribute not found in schema');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureResource(createFn, label) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      await createFn();
      console.log(`created: ${label}`);
      return;
    } catch (error) {
      if (isAlreadyExistsError(error)) {
        console.log(`exists: ${label}`);
        return;
      }

      if (isNotReadyError(error) && attempt < 8) {
        console.log(`waiting: ${label}`);
        await sleep(1500 * attempt);
        continue;
      }

      throw error;
    }
  }
}

async function createAttribute(databases, collectionId, attribute) {
  if (attribute.kind === 'string') {
    return databases.createStringAttribute(
      CONFIG.databaseId,
      collectionId,
      attribute.key,
      attribute.size,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      Boolean(attribute.array)
    );
  }

  if (attribute.kind === 'integer') {
    return databases.createIntegerAttribute(
      CONFIG.databaseId,
      collectionId,
      attribute.key,
      attribute.required,
      attribute.min,
      attribute.max,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      Boolean(attribute.array)
    );
  }

  if (attribute.kind === 'boolean') {
    return databases.createBooleanAttribute(
      CONFIG.databaseId,
      collectionId,
      attribute.key,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      Boolean(attribute.array)
    );
  }

  if (attribute.kind === 'datetime') {
    return databases.createDatetimeAttribute(
      CONFIG.databaseId,
      collectionId,
      attribute.key,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      Boolean(attribute.array)
    );
  }

  throw new Error(`Unsupported attribute kind: ${attribute.kind}`);
}

async function listExistingAttributeKeys(databases, collectionId) {
  try {
    const response = await databases.listAttributes(CONFIG.databaseId, collectionId);
    return new Set((response.attributes || []).map((attribute) => attribute.key).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

async function listExistingIndexKeys(databases, collectionId) {
  try {
    const response = await databases.listIndexes(CONFIG.databaseId, collectionId);
    return new Set((response.indexes || []).map((index) => index.key).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

async function ensureCollection(databases, collection) {
  await ensureResource(
    () => databases.createCollection(CONFIG.databaseId, collection.id, collection.name, COLLECTION_PERMISSIONS, true, true),
    `collection ${collection.id}`
  );

  const existingAttributeKeys = await listExistingAttributeKeys(databases, collection.id);
  for (const attribute of collection.attributes) {
    if (existingAttributeKeys.has(attribute.key)) {
      console.log(`exists: attribute ${collection.id}.${attribute.key}`);
      continue;
    }

    await ensureResource(
      () => createAttribute(databases, collection.id, attribute),
      `attribute ${collection.id}.${attribute.key}`
    );
    existingAttributeKeys.add(attribute.key);
  }

  await sleep(1500);

  const existingIndexKeys = await listExistingIndexKeys(databases, collection.id);
  for (const index of collection.indexes || []) {
    if (existingIndexKeys.has(index.key)) {
      console.log(`exists: index ${collection.id}.${index.key}`);
      continue;
    }

    await ensureResource(
      () => databases.createIndex(
        CONFIG.databaseId,
        collection.id,
        index.key,
        index.type,
        index.attributes,
        index.orders,
        index.lengths
      ),
      `index ${collection.id}.${index.key}`
    );
    existingIndexKeys.add(index.key);
  }
}

async function ensureBucket(storage, bucket) {
  const permissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ];

  try {
    const existingBucket = await storage.getBucket(bucket.id);
    console.log(`exists: bucket ${existingBucket.$id}`);
  } catch (_) {
    await ensureResource(
      () => storage.createBucket(
        bucket.id,
        bucket.name,
        permissions,
        true,
        true,
        bucket.maxFileSize,
        bucket.allowedFileExtensions,
        'none',
        true,
        true
      ),
      `bucket ${bucket.id}`
    );
  }

  await ensureResource(
    () => storage.updateBucket(
      bucket.id,
      bucket.name,
      permissions,
      true,
      true,
      bucket.maxFileSize,
      bucket.allowedFileExtensions,
      'none',
      true,
      true,
      true
    ),
    `bucket settings ${bucket.id}`
  );
}

async function main() {
  if (!CONFIG.apiKey) {
    throw new Error('Missing APPWRITE_API_KEY environment variable.');
  }

  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    const existingDatabase = await databases.get(CONFIG.databaseId);
    console.log(`exists: database ${existingDatabase.$id}`);
  } catch (error) {
    await ensureResource(
      () => databases.create(CONFIG.databaseId, CONFIG.databaseName),
      `database ${CONFIG.databaseId}`
    );
  }

  for (const collection of COLLECTIONS) {
    await ensureCollection(databases, collection);
  }

  for (const bucket of CONFIG.buckets) {
    await ensureBucket(storage, bucket);
  }

  console.log('Appwrite bootstrap complete.');
}

main().catch((error) => {
  console.error('Appwrite bootstrap failed.');
  console.error(error?.message || error);
  process.exitCode = 1;
});
