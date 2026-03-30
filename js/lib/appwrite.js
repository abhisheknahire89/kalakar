import { Client, Account, Databases, ID, Query } from 'https://cdn.jsdelivr.net/npm/appwrite@14.0.1/+esm';
import { getRuntimeConfig } from '../config/runtimeConfig.js';

let sdk = null;

export function getAppwrite() {
  if (sdk) return sdk;

  const config = getRuntimeConfig();
  const client = new Client().setEndpoint(config.endpoint).setProject(config.projectId);

  sdk = {
    config,
    client,
    account: new Account(client),
    databases: new Databases(client),
    ID,
    Query
  };

  return sdk;
}
