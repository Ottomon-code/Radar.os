# Security Specification & Invariants

## Roles
- **Anonymous / Unauthenticated**: Zero direct Firestore read/write access across all collections.
- **Authenticated User (`isOwner(userId)`)**: Full owner isolation inside `/users/{userId}` subcollections (`preferences`, `careerPaths`, `savedJobs`, `jobAlerts`, `alertNotifications`, `stealthPersona`, `atsNotes`) and read-only access to own `/subscriptions` and `/referrals`.
- **Verified User (`isVerifiedUser()`)**: Authenticated user with `request.auth.token.email_verified == true`, eligible for community interactions (`/stealthPosts`, `/stealthPosts/{postId}/comments`, `/stealthPosts/{postId}/reactions`, `/stealthPings`, `/verifiedOffers`).
- **App Owner (`isAppOwner()`)**: Authenticated user with `request.auth.token.email == 'mortyp1125@gmail.com' && request.auth.token.email_verified == true`, granted read-only audit access to `/contactInquiries` and `/agencyPilotRequests`.
- **Server Admin / Backend (`server.ts`)**: Exclusive writer for `/subscriptions`, `/referrals`, `/contactInquiries`, and `/agencyPilotRequests` via Firebase Admin / OAuth access token.

## Core Security Invariants
1. **Default-Deny Safety Net**: `match /{document=**} { allow read, write: if false; }` at root.
2. **Strict Multi-Tenant Ownership**:
   - `/users/{userId}` allows `get` only to `isOwner(userId)` (`allow list: if false` prevents user enumeration/PII scraping). Role and `securityClearance` are locked after creation.
   - `/users/{userId}/jobAlerts/{alertId}`, `/alertNotifications/{notifId}`, `/stealthPersona/{personaId}`, `/atsNotes/{noteId}` enforce `isOwner(userId)`, `userId == request.auth.uid`, valid doc IDs, and strict key/type/length limits.
   - `/stealthPings/{pingId}` enforces participant-only visibility (`resource.data.senderUid == request.auth.uid || resource.data.recipientUid == request.auth.uid`). Sender cannot target themselves (`senderUid != recipientUid`). Only recipient may transition `status` from `'pending'` to `'accepted'` or `'declined'`; transitions out of terminal states are denied.
3. **Anti-Spoofing & Server Timestamp Enforcement**:
   - Client-written timestamps in `jobAlerts`, `alertNotifications`, `stealthPersona`, `atsNotes`, `stealthPosts`, `comments`, `reactions`, and `stealthPings` must pass `== request.time` (written via `serverTimestamp()`) and remain immutable on `createdAt`.
4. **No Parent Counter Tampering / Vote Stuffing**:
   - `/stealthPosts/{postId}` stores author content only (`title`, `content`, `category`, `sector`, `tags`, `compensationTag`, `locationTag`, `canDirectPing`, `isUrgent`) — no client-mutable `upvotes` or `peerVouches` counters on the post doc.
   - Upvotes and peer vouches live in `/stealthPosts/{postId}/reactions/{reactionId}` with `reactionId == request.auth.uid + '_' + incoming().type`, preventing duplicate votes/vouches per user and cross-user tampering.
5. **No Parentless Orphans & No Expensive `list` Lookups**:
   - Comments and reactions enforce `exists(/databases/$(database)/documents/stealthPosts/$(postId))` on `create`.
   - Zero `exists()` or `get()` calls inside any `allow list` rule.
6. **Admin-Only Inquiry Ledgers**:
   - `/contactInquiries` and `/agencyPilotRequests` disallow all client `create`, `update`, `delete` operations (`if false`) and restrict `read` to `isAppOwner()`.

## Dirty Dozen Checklist Mapping
- Unauthenticated global read/write: Denied by default-deny and `isSignedIn()`/`isVerifiedUser()`.
- Broad list queries on PII (`/users`, `/stealthPings`, `/contactInquiries`, `/agencyPilotRequests`): Prevented (`users` list false; `stealthPings` scoped to `senderUid`/`recipientUid`; inquiries restricted to `isAppOwner()`).
- Privilege escalation (`role`, `securityClearance`, `verificationBadge`): Locked on create/immutable on update; `verifiedOffers` fixed to `'COMMUNITY_PENDING_AUDIT'`.
- Arbitrary key injection / oversized payloads: Blocked by explicit `hasOnly`, `.size()` string/list caps, and element type validation.
- Vote/vouch spoofing or counter manipulation: Eliminated via deterministic reaction doc ID `${uid}_${type}` and single-owner reaction docs.
- Timestamp forgery: `createdAt == request.time` and `updatedAt == request.time` on all new Firestore client entities.
