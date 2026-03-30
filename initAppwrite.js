#!/usr/bin/env node

'use strict';

const sdk = require('node-appwrite');

const CONFIG = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || '69c8ee1b0037e381d046',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: 'kalakar_db',
  databaseName: 'kalakar_db',
  bucketId: 'avatars',
  bucketName: 'avatars',
  maxAvatarSizeBytes: 100 * 1024 * 1024
};

const COLLECTIONS = [
  {
    id: 'creators',
    name: 'creators',
    attributes: [
      { kind: 'string', key: 'name', size: 120, required: true },
      { kind: 'string', key: 'username', size: 60, required: true },
      { kind: 'string', key: 'bio', size: 1000, required: false },
      { kind: 'string', key: 'avatarFileId', size: 64, required: false },
      { kind: 'string', key: 'city', size: 80, required: false },
      { kind: 'string', key: 'language', size: 40, required: false },
      { kind: 'boolean', key: 'isVerified', required: false, default: false },
      { kind: 'datetime', key: 'createdAt', required: true }
    ]
  },
  {
    id: 'posts',
    name: 'posts',
    attributes: [
      { kind: 'string', key: 'creatorId', size: 36, required: true },
      { kind: 'string', key: 'content', size: 5000, required: true },
      { kind: 'string', key: 'mediaFileId', size: 64, required: false },
      { kind: 'integer', key: 'likeCount', required: false, min: 0, max: 1000000000, default: 0 },
      { kind: 'datetime', key: 'createdAt', required: true }
    ]
  },
  {
    id: 'connections',
    name: 'connections',
    attributes: [
      { kind: 'string', key: 'requesterId', size: 36, required: true },
      { kind: 'string', key: 'recipientId', size: 36, required: true },
      { kind: 'string', key: 'status', size: 20, required: true, default: 'pending' },
      { kind: 'string', key: 'note', size: 300, required: false },
      { kind: 'datetime', key: 'createdAt', required: true }
    ]
  }
];

function isAlreadyExistsError(error) {
  if (!error) return false;
  const code = Number(error.code || error.response?.status || error.statusCode);
  const type = String(error.type || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();
  return (
    code === 409 ||
    type.includes('already') ||
    message.includes('already exists') ||
    message.includes('duplicate')
  );
}

async function ensureResource(createFn, label) {
  try {
    await createFn();
    console.log(`created: ${label}`);
    return { created: true, label };
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      console.log(`exists: ${label}`);
      return { created: false, label };
    }
    throw error;
  }
}

async function createAttribute(databases, databaseId, collectionId, attribute) {
  const { kind, key } = attribute;

  if (kind === 'string') {
    return databases.createStringAttribute(
      databaseId,
      collectionId,
      key,
      attribute.size,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      false
    );
  }

  if (kind === 'integer') {
    return databases.createIntegerAttribute(
      databaseId,
      collectionId,
      key,
      attribute.required,
      attribute.min,
      attribute.max,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      false
    );
  }

  if (kind === 'boolean') {
    return databases.createBooleanAttribute(
      databaseId,
      collectionId,
      key,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      false
    );
  }

  if (kind === 'datetime') {
    return databases.createDatetimeAttribute(
      databaseId,
      collectionId,
      key,
      attribute.required,
      typeof attribute.default === 'undefined' ? undefined : attribute.default,
      false
    );
  }

  throw new Error(`Unsupported attribute kind: ${kind}`);
}

async function ensureCollection(databases, databaseId, collection) {
  await ensureResource(
    () => {
      if (typeof databases.createCollection === 'function') {
        return databases.createCollection(databaseId, collection.id, collection.name);
      }
      return databases.createCollection({
        databaseId,
        collectionId: collection.id,
        name: collection.name
      });
    },
    `collection ${collection.id}`
  );

  for (const attribute of collection.attributes) {
    await ensureResource(
      () => createAttribute(databases, databaseId, collection.id, attribute),
      `attribute ${collection.id}.${attribute.key}`
    );
  }
}

async function ensureBucket(storage) {
  await ensureResource(
    () =>
      typeof storage.createBucket === 'function'
        ? storage.createBucket(
            CONFIG.bucketId,
            CONFIG.bucketName,
            [],
            false,
            true,
            CONFIG.maxAvatarSizeBytes
          )
        : storage.createBucket({
            bucketId: CONFIG.bucketId,
            name: CONFIG.bucketName,
            permissions: [],
            fileSecurity: false,
            enabled: true,
            maximumFileSize: CONFIG.maxAvatarSizeBytes
          }),
    `bucket ${CONFIG.bucketId}`
  );
}

async function main() {
  if (!CONFIG.apiKey) {
    throw new Error('Missing APPWRITE_API_KEY environment variable.');
  }

  const client = new sdk.Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);

  const databases = new sdk.Databases(client);
  const storage = new sdk.Storage(client);

  await ensureResource(
    () => {
      if (typeof databases.create === 'function') {
        return databases.create(CONFIG.databaseId, CONFIG.databaseName);
      }
      if (typeof databases.createDatabase === 'function') {
        return databases.createDatabase(CONFIG.databaseId, CONFIG.databaseName);
      }
      return databases.create({
        databaseId: CONFIG.databaseId,
        name: CONFIG.databaseName
      });
    },
    `database ${CONFIG.databaseId}`
  );

  for (const collection of COLLECTIONS) {
    await ensureCollection(databases, CONFIG.databaseId, collection);
  }

  await ensureBucket(storage);

  console.log('init complete');
}

main().catch((error) => {
  console.error('init failed');
  console.error(error?.message || error);
  process.exitCode = 1;
});
