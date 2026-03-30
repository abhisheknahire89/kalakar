const REQUIRED_KEYS = [
  'endpoint',
  'projectId',
  'databaseId',
  'collections.jobs',
  'collections.applications'
];

const FALLBACK_CONFIG = {
  endpoint: 'https://fra.cloud.appwrite.io/v1',
  projectId: '69c8ee1b0037e381d046',
  databaseId: 'kalakar_db',
  collections: {
    jobs: 'jobs',
    applications: 'applications'
  }
};

function readMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || '';
}

function readRuntimeConfig() {
  const globalConfig = window.__KALAKAR_CONFIG || {};

  return {
    endpoint: globalConfig.endpoint || readMeta('kalakar-endpoint'),
    projectId: globalConfig.projectId || readMeta('kalakar-project-id'),
    databaseId: globalConfig.databaseId || readMeta('kalakar-database-id'),
    collections: {
      jobs: globalConfig.collections?.jobs || readMeta('kalakar-collection-jobs'),
      applications: globalConfig.collections?.applications || readMeta('kalakar-collection-applications')
    }
  };
}

export function getRuntimeConfig() {
  const config = readRuntimeConfig();

  const missing = REQUIRED_KEYS.filter((key) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      return !config[parent]?.[child];
    }
    return !config[key];
  });

  if (missing.length > 0) {
    console.warn(
      `[kalakar] Missing runtime config keys: ${missing.join(
        ', '
      )}. Falling back to safe defaults.`
    );
  }

  return {
    endpoint: config.endpoint || FALLBACK_CONFIG.endpoint,
    projectId: config.projectId || FALLBACK_CONFIG.projectId,
    databaseId: config.databaseId || FALLBACK_CONFIG.databaseId,
    collections: {
      jobs: config.collections?.jobs || FALLBACK_CONFIG.collections.jobs,
      applications:
        config.collections?.applications || FALLBACK_CONFIG.collections.applications
    }
  };
}
