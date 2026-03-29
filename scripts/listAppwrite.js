import { Client, Databases, Storage } from 'node-appwrite';

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '69c8ee1b0037e381d046';
const apiKey = 'standard_eed0746f83a459190bf12a9e8b99dedab3626888e1add06f6439f3bfa2c5e9d3a9e67305a44021f9fcb821c334e70d541914a62976466dbe6ec10db47a3a0d1ba147ce080c9021d192c0cbdfbe5c61b6935286159cc696340adc862802ef7218c140df41275e16d25a5aeab5b9073d80a6908c79f524a3bf960d9e5abe512b89';

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);
const storage = new Storage(client);

async function list() {
  try {
    const dbs = await databases.list();
    console.log('DATABASES:', dbs.databases.map(d => ({id: d.$id, name: d.name})));
    const buckets = await storage.listBuckets();
    console.log('BUCKETS:', buckets.buckets.map(b => ({id: b.$id, name: b.name})));
  } catch(e) { console.error(e); }
}
list();
