#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const filesToCheck = [
  'app.js',
  'initAppwrite.js',
  'js/appwriteClient.js',
  'js/auth.js',
  'js/views/login.js',
  'js/views/loginPage.js',
  'js/views/onboarding.js',
  'js/views/onboardingPage.js',
  'js/views/stageFeed.js',
  'js/views/videoFeed.js',
  'js/views/jobBoardPage.js',
  'js/components/chat.js',
  'js/components/feed.js',
  'js/components/jobs.js',
  'js/components/kanban.js',
  'js/components/network.js',
  'js/components/notifications.js',
  'js/components/postComposer.js',
  'js/components/vouchModal.js',
  'js/config/runtimeConfig.js',
  'js/lib/appwrite.js',
  'js/services/jobsService.js',
  'js/utils/response.js'
];

const missing = filesToCheck.filter((file) => !existsSync(path.join(ROOT, file)));
if (missing.length > 0) {
  console.error('Health check failed: missing files:');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

for (const file of filesToCheck) {
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: ROOT,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Health check passed.');
