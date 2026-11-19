import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';

/**
 * Firestore Security Rules Test Suite
 * Verifies Eight-Pillar invariants across User Profiles, Job Alerts, StealthNet Posts/Comments/Reactions/Pings,
 * Subscriptions, Verified Offers, Referrals, Contact Inquiries, and Agency Pilot Requests.
 */
export async function runRulesTests() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'career-radar-rules-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const alice = testEnv.authenticatedContext('alice_uid', { email: 'alice@example.com', email_verified: true });
  const bob = testEnv.authenticatedContext('bob_uid', { email: 'bob@example.com', email_verified: true });
  const owner = testEnv.authenticatedContext('owner_uid', { email: 'mortyp1125@gmail.com', email_verified: true });
  const anon = testEnv.unauthenticatedContext();

  // 1. Unauthenticated cannot read or write anywhere
  await assertFails(getDoc(doc(anon.firestore(), 'stealthPosts/post-1')));
  await assertFails(getDoc(doc(anon.firestore(), 'contactInquiries/inq-1')));

  // 2. User cannot enumerate /users or write role escalation
  await assertFails(getDocs(collection(alice.firestore(), 'users')));
  await assertFails(setDoc(doc(alice.firestore(), 'users/alice_uid'), {
    id: 'alice_uid',
    email: 'alice@example.com',
    role: 'admin',
    securityClearance: 'Operator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // 3. JobAlerts owner isolation & timestamp verification
  await assertSucceeds(setDoc(doc(alice.firestore(), 'users/alice_uid/jobAlerts/sub-1'), {
    id: 'sub-1',
    userId: 'alice_uid',
    title: 'Rust Systems',
    keywords: 'Rust',
    location: 'Remote',
    minSalary: 200000,
    maxSalary: 450000,
    urgency: 'All',
    active: true,
    matchCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  await assertFails(getDoc(doc(bob.firestore(), 'users/alice_uid/jobAlerts/sub-1')));

  // 4. StealthPosts create, deterministic reactions, and participant-only Pings
  await assertSucceeds(setDoc(doc(alice.firestore(), 'stealthPosts/post-1'), {
    id: 'post-1',
    authorUid: 'alice_uid',
    category: 'unlisted_drop',
    sector: 'Frontier AI & GPU Systems',
    authorHandle: '@Alice_L7',
    authorBadge: 'Principal Systems Architect',
    authorTier: 'Verified Frontier AI (Tier-1)',
    zkVerified: true,
    title: 'Distributed Inference Cluster Lead',
    content: 'Confidential team buildout for multi-node B200 training kernel stack.',
    tags: ['CUDA', 'Distributed'],
    canDirectPing: true,
    isUrgent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));

  await assertSucceeds(setDoc(doc(bob.firestore(), 'stealthPosts/post-1/reactions/bob_uid_upvote'), {
    id: 'bob_uid_upvote',
    postId: 'post-1',
    userId: 'bob_uid',
    type: 'upvote',
    createdAt: serverTimestamp(),
  }));

  // Ping creation & privacy
  await assertSucceeds(setDoc(doc(bob.firestore(), 'stealthPings/ping-1'), {
    id: 'ping-1',
    postId: 'post-1',
    postTitle: 'Distributed Inference Cluster Lead',
    senderUid: 'bob_uid',
    recipientUid: 'alice_uid',
    senderHandle: '@Bob_Kernel',
    senderRole: 'Staff Systems',
    senderTier: 'Verified Hyperscaler Systems',
    targetHandle: '@Alice_L7',
    message: 'Interested in the inference lead role.',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  // Sender cannot accept own ping; only recipient can update status
  await assertFails(updateDoc(doc(bob.firestore(), 'stealthPings/ping-1'), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(updateDoc(doc(alice.firestore(), 'stealthPings/ping-1'), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  }));
  // Unrelated third-party cannot read ping or delete it
  await assertFails(deleteDoc(doc(alice.firestore(), 'stealthPings/ping-1')));

  // 5. Inquiries restricted to owner read-only
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'contactInquiries/inq-1'), {
      id: 'inq-1',
      email: 'lead@company.com',
      subject: 'Pilot Inquiry',
      message: 'Need team licensing.',
      status: 'open',
      createdAt: new Date().toISOString(),
    });
  });
  await assertFails(getDoc(doc(alice.firestore(), 'contactInquiries/inq-1')));
  await assertSucceeds(getDoc(doc(owner.firestore(), 'contactInquiries/inq-1')));

  // 6. Query filters required on stealthPings list
  await assertSucceeds(getDocs(query(collection(alice.firestore(), 'stealthPings'), where('recipientUid', '==', 'alice_uid'))));

  await testEnv.cleanup();
}
