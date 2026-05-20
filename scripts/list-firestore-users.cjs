#!/usr/bin/env node
/**
 * List users in Firestore (same DB as the app).
 * Usage: node scripts/list-firestore-users.cjs
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON or split FIREBASE_* vars in .env
 */
require('dotenv').config();
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

function loadCred() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    const cred = JSON.parse(raw);
    if (cred.private_key) cred.private_key = cred.private_key.replace(/\\n/g, '\n');
    return cred;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (projectId && clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
  }
  throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID + CLIENT_EMAIL + PRIVATE_KEY');
}

async function main() {
  const cred = loadCred();
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: cred.project_id,
        clientEmail: cred.client_email,
        privateKey: cred.private_key,
      }),
    });
  }
  const db = getFirestore();
  const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(15).get();

  console.log('\nFirebase project:', cred.project_id);
  console.log('Database: (default)');
  console.log('Collection: users');
  console.log('Recent documents:', snap.size, '\n');

  if (snap.empty) {
    console.log('No users found. Register on the site or run db:migrate-firestore.\n');
    return;
  }

  snap.docs.forEach((doc) => {
    const d = doc.data();
    console.log(`- ${doc.id}`);
    console.log(`  email: ${d.email}`);
    console.log(`  name: ${d.name}`);
    console.log(`  role: ${d.role}`);
    console.log(`  createdAt: ${d.createdAt}\n`);
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
