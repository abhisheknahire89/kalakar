import { getAppwrite } from '../lib/appwrite.js';
import { ok, fail, toErrorMessage } from '../utils/response.js';

function buildJobPayload(input, userId) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    city: input.city.trim(),
    roleType: input.roleType.trim(),
    experienceLevel: input.experienceLevel.trim(),
    createdBy: userId,
    createdAt: new Date().toISOString(),
    isOpen: true
  };
}

export async function getCurrentUserSafe() {
  try {
    const { account } = getAppwrite();
    const user = await account.get();
    return ok(user);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function listJobs({ limit = 10, cursor = null } = {}) {
  try {
    const { databases, Query, config } = getAppwrite();
    const queries = [Query.orderDesc('createdAt'), Query.limit(limit)];

    if (cursor) queries.push(Query.cursorAfter(cursor));

    const result = await databases.listDocuments(
      config.databaseId,
      config.collections.jobs,
      queries
    );

    return ok({
      jobs: result.documents || [],
      total: result.total || 0,
      nextCursor:
        result.documents && result.documents.length > 0
          ? result.documents[result.documents.length - 1].$id
          : null
    });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function createJob(input) {
  try {
    const required = ['title', 'description', 'city', 'roleType', 'experienceLevel'];
    const missing = required.filter((key) => !String(input?.[key] || '').trim());

    if (missing.length) {
      return fail(`Missing required fields: ${missing.join(', ')}`);
    }

    const { databases, ID, config, account } = getAppwrite();
    const user = await account.get();
    const payload = buildJobPayload(input, user.$id);

    const document = await databases.createDocument(
      config.databaseId,
      config.collections.jobs,
      ID.unique(),
      payload
    );

    return ok(document);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function applyToJob(jobId, note = '') {
  try {
    if (!jobId) return fail('Job ID is required.');

    const { databases, Query, ID, config, account } = getAppwrite();
    const user = await account.get();

    const existing = await databases.listDocuments(
      config.databaseId,
      config.collections.applications,
      [Query.equal('jobId', jobId), Query.equal('applicantId', user.$id), Query.limit(1)]
    );

    if ((existing.documents || []).length > 0) {
      return fail('You already applied to this job.');
    }

    const doc = await databases.createDocument(
      config.databaseId,
      config.collections.applications,
      ID.unique(),
      {
        jobId,
        applicantId: user.$id,
        note: String(note || '').trim(),
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
    );

    return ok(doc);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
