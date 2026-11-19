/**
 * StealthNet // The Semi-Anonymous Professional Market Network
 * Data structures, seed intelligence, verification protocols, and storage management
 */

export type StealthCategory =
  | 'unlisted_drop'
  | 'comp_intel'
  | 'ground_truth'
  | 'candidate_pitch'
  | 'tech_debate';

export type StealthSector =
  | 'All'
  | 'Frontier AI & GPU Systems'
  | 'Defense Tech & Dual-Use'
  | 'Quant & High-Frequency Trading'
  | 'Distributed Systems & Cloud'
  | 'Autonomous Robotics & Hardware'
  | 'BioTech & HealthTech';

export type VerificationTier =
  | 'Verified Frontier AI (Tier-1)'
  | 'Verified Defense Prime (Dual-Use)'
  | 'Verified Quant / HFT (L6+)'
  | 'Verified Hyperscaler Systems'
  | 'Verified Series B Founder / VP'
  | 'Verified Principal Architect'
  | 'Verified DeepTech Researcher';

export interface StealthComment {
  id: string;
  authorHandle: string;
  authorBadge: string;
  authorTier: VerificationTier;
  content: string;
  timestamp: string;
  upvotes: number;
  isPeerVouched?: boolean;
}

export interface StealthPost {
  id: string;
  category: StealthCategory;
  sector: StealthSector;
  authorHandle: string;
  authorBadge: string;
  authorTier: VerificationTier;
  zkVerified: boolean;
  title: string;
  content: string;
  compensationTag?: string; // e.g. "$480k - $650k TC"
  locationTag?: string;     // e.g. "Remote US" | "SF Bay Area" | "New York (Onsite)"
  tags: string[];
  upvotes: number;
  downvotes: number;
  peerVouches: number;      // Peers at same tier who validated the intel
  comments: StealthComment[];
  timestamp: string;
  isUrgent?: boolean;
  canDirectPing?: boolean;  // Enables encrypted 1-on-1 backchannel handshake
  contactActionLabel?: string; // e.g. "Send Stealth Pitch" or "Request Encrypted Brief"
  savedAt?: string;
  isLiveAts?: boolean;
  sourceAts?: 'ashby' | 'greenhouse' | 'lever';
  externalUrl?: string;
  companyName?: string;
  authorUid?: string;
}

export interface StealthBackchannelPing {
  id: string;
  postId: string;
  postTitle: string;
  senderUid?: string;
  recipientUid?: string;
  senderHandle: string;
  senderRole: string;
  senderTier: VerificationTier;
  targetHandle: string;
  offerCompensation?: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface UserStealthPersona {
  handle: string;
  tier: VerificationTier;
  badge: string;
  disclosureLevel: 'Pure Stealth (Masked)' | 'Verified Tier (Standard)' | 'Selective Decrypt (Recruiters)';
  bio: string;
  primaryStack: string[];
  minCompensationFloor: string;
  openToBackchannel: boolean;
}

export const INITIAL_USER_PERSONA: UserStealthPersona = {
  handle: '@Specter_Systems_L7',
  tier: 'Verified Frontier AI (Tier-1)',
  badge: 'Principal Systems Architect',
  disclosureLevel: 'Verified Tier (Standard)',
  bio: 'Specialized in high-throughput distributed tensor parallelism, CUDA kernel optimization, and fault-tolerant multi-node fabric (16k+ H100/B200 clusters).',
  primaryStack: ['CUDA / C++', 'PyTorch / Triton', 'vLLM & TensorRT-LLM', 'InfiniBand / RoCE', 'Distributed Systems'],
  minCompensationFloor: '$450,000 Base+Equity',
  openToBackchannel: true,
};

export const SEED_STEALTH_POSTS: StealthPost[] = [];

export const SEED_BACKCHANNEL_PINGS: StealthBackchannelPing[] = [];

const LEGACY_SEED_POST_IDS = new Set(['post-101', 'post-102', 'post-103', 'post-104', 'post-105', 'post-106']);
const LEGACY_SEED_PING_IDS = new Set(['ping-1', 'ping-2']);

const LOCAL_STORAGE_POSTS_KEY = 'radar_stealthnet_posts_v2';
const LOCAL_STORAGE_PINGS_KEY = 'radar_stealthnet_pings_v2';
const LOCAL_STORAGE_PERSONA_KEY = 'radar_stealthnet_persona_v1';

export function getStoredStealthPosts(): StealthPost[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && !LEGACY_SEED_POST_IDS.has(p.id) && !p.isLiveAts);
  } catch {
    return [];
  }
}

export function saveStoredStealthPosts(posts: StealthPost[]): void {
  try {
    const userOnly = posts.filter((p) => p && !p.isLiveAts && !LEGACY_SEED_POST_IDS.has(p.id));
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(userOnly));
  } catch (e) {
    console.error('Failed to save stealth posts:', e);
  }
}

export function getStoredBackchannelPings(): StealthBackchannelPing[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && !LEGACY_SEED_PING_IDS.has(p.id));
  } catch {
    return [];
  }
}

export function saveStoredBackchannelPings(pings: StealthBackchannelPing[]): void {
  try {
    const clean = pings.filter((p) => p && !LEGACY_SEED_PING_IDS.has(p.id));
    localStorage.setItem(LOCAL_STORAGE_PINGS_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save pings:', e);
  }
}

export function getStoredUserPersona(): UserStealthPersona {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PERSONA_KEY);
    if (!raw) return INITIAL_USER_PERSONA;
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_USER_PERSONA;
  }
}

export function saveStoredUserPersona(persona: UserStealthPersona): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PERSONA_KEY, JSON.stringify(persona));
  } catch (e) {
    console.error('Failed to save persona:', e);
  }
}
