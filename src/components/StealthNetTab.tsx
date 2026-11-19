import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  EyeOff,
  Lock,
  Search,
  MessageSquare,
  Bookmark,
  Share2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Flame,
  DollarSign,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  Send,
  ThumbsUp,
  X,
  FileText,
  BadgeCheck,
  RefreshCw,
  Award,
  Plus,
  StickyNote,
  AlertCircle,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  StealthPost,
  StealthCategory,
  StealthSector,
  VerificationTier,
  StealthComment,
  StealthBackchannelPing,
  UserStealthPersona,
  INITIAL_USER_PERSONA,
} from '../utils/stealthNetData';
import { useSavedItems } from '../context/SavedItemsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

interface StealthNetTabProps {
  onNavigateToCareer?: (role: string, salary?: number) => void;
  onNavigateToJobs?: (keyword?: string) => void;
  onNavigateToFinance?: () => void;
}

interface AtsNoteRecord {
  id: string;
  userId: string;
  atsPostId: string;
  company: string;
  roleTitle: string;
  externalUrl?: string;
  note: string;
  createdAt?: any;
}

const CATEGORY_TABS: { id: 'all' | StealthCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Channels', icon: '🌐' },
  { id: 'unlisted_drop', label: 'Unlisted Drops', icon: '🚀' },
  { id: 'comp_intel', label: 'Comp & Leveling', icon: '💼' },
  { id: 'ground_truth', label: 'Ground Truth & Leaks', icon: '🕵️' },
  { id: 'candidate_pitch', label: 'Stealth Pitches', icon: '🎯' },
  { id: 'tech_debate', label: 'Architecture Debates', icon: '💡' },
];

const SECTORS: StealthSector[] = [
  'All',
  'Frontier AI & GPU Systems',
  'Defense Tech & Dual-Use',
  'Quant & High-Frequency Trading',
  'Distributed Systems & Cloud',
  'Autonomous Robotics & Hardware',
  'BioTech & HealthTech',
];

const VERIFICATION_TIERS: VerificationTier[] = [
  'Verified Frontier AI (Tier-1)',
  'Verified Defense Prime (Dual-Use)',
  'Verified Quant / HFT (L6+)',
  'Verified Hyperscaler Systems',
  'Verified Series B Founder / VP',
  'Verified Principal Architect',
  'Verified DeepTech Researcher',
];

function formatFirestoreTime(val: any): string {
  if (!val) return 'Just now';
  if (val instanceof Timestamp) {
    return val.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof val?.toDate === 'function') {
    return val.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof val === 'string') return val;
  return 'Synced';
}

export default function StealthNetTab(_props: StealthNetTabProps) {
  const { saveNewsItem, isNewsSaved, removeNewsItem } = useSavedItems();
  const { isPro, openPaywall } = useSubscription();
  const { user } = useAuth();

  // Live ATS Organization Wire (Public Read) + Community Firestore Posts (Signed-in Sync)
  const [communityPosts, setCommunityPosts] = useState<StealthPost[]>([]);
  const [liveAtsPosts, setLiveAtsPosts] = useState<StealthPost[]>([]);
  const [isLoadingAts, setIsLoadingAts] = useState(true);
  const [isRefreshingAts, setIsRefreshingAts] = useState(false);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [atsMeta, setAtsMeta] = useState<{
    isLive: boolean;
    scrapedAt: string;
    boardCount: number;
    boardsSucceeded: number;
    totalOpeningsAcrossBoards: number;
  } | null>(null);

  const [pings, setPings] = useState<StealthBackchannelPing[]>([]);
  const [atsNotes, setAtsNotes] = useState<AtsNoteRecord[]>([]);
  const [userPersona, setUserPersona] = useState<UserStealthPersona>(INITIAL_USER_PERSONA);

  // Per-post live subcollection maps for community posts
  const [commentsByPost, setCommentsByPost] = useState<Record<string, StealthComment[]>>({});
  const [reactionsByPost, setReactionsByPost] = useState<
    Record<string, { upvotes: number; vouches: number; userUpvoted: boolean; userVouched: boolean }>
  >({});

  // Combine community posts (augmented with live reaction/comment counts) + live ATS cards
  const posts = useMemo(() => {
    const hydratedCommunity = communityPosts.map((p) => {
      const r = reactionsByPost[p.id];
      const c = commentsByPost[p.id];
      return {
        ...p,
        upvotes: r ? r.upvotes : p.upvotes,
        peerVouches: r ? r.vouches : p.peerVouches,
        comments: c || p.comments,
      };
    });
    return [...hydratedCommunity, ...liveAtsPosts];
  }, [communityPosts, liveAtsPosts, reactionsByPost, commentsByPost]);

  // Dynamic pulse metrics derived directly from live posts & ATS telemetry (zero static claims)
  const livePulseMetrics = useMemo(() => {
    const frontierCount = posts.filter((p) => p.sector === 'Frontier AI & GPU Systems').length;
    const defenseCount = posts.filter((p) => p.sector === 'Defense Tech & Dual-Use').length;
    const cloudCount = posts.filter((p) => p.sector === 'Distributed Systems & Cloud').length;
    const disclosedCompCount = posts.filter((p) => Boolean(p.compensationTag)).length;
    return { frontierCount, defenseCount, cloudCount, disclosedCompCount };
  }, [posts]);

  const fetchLiveStealthFeed = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshingAts(true);
    setAtsError(null);
    try {
      const url = forceRefresh ? '/api/stealthnet/feed?refresh=1' : '/api/stealthnet/feed';
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to fetch live ATS StealthNet wire.');
      }
      const incoming: StealthPost[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.posts)
        ? data.posts
        : [];
      setLiveAtsPosts(incoming);
      if (data?.meta) setAtsMeta(data.meta);
    } catch (err: any) {
      setAtsError(err?.message || 'Unable to load live ATS StealthNet feed.');
    } finally {
      setIsLoadingAts(false);
      setIsRefreshingAts(false);
    }
  };

  useEffect(() => {
    fetchLiveStealthFeed(false);
  }, []);

  // Firestore real-time listeners when authenticated
  useEffect(() => {
    if (!user) {
      setCommunityPosts([]);
      setPings([]);
      setAtsNotes([]);
      setCommentsByPost({});
      setReactionsByPost({});
      return;
    }

    // 1. Stealth Persona
    const personaRef = doc(db, 'users', user.uid, 'stealthPersona', 'profile');
    const unsubPersona = onSnapshot(
      personaRef,
      (snap) => {
        if (snap.exists()) {
          const d = snap.data() as any;
          setUserPersona({
            handle: d.handle || INITIAL_USER_PERSONA.handle,
            tier: d.tier || INITIAL_USER_PERSONA.tier,
            badge: d.badge || INITIAL_USER_PERSONA.badge,
            disclosureLevel: d.disclosureLevel || INITIAL_USER_PERSONA.disclosureLevel,
            bio: d.bio || '',
            primaryStack: Array.isArray(d.primaryStack) ? d.primaryStack : [],
            minCompensationFloor: d.minCompensationFloor || '$450,000 Base+Equity',
            openToBackchannel: d.openToBackchannel ?? true,
          });
        }
      },
      (err) => {
        console.warn('Stealth persona sync warning:', err.message);
      }
    );

    // 2. Community StealthPosts (requires isSignedIn)
    const postsQuery = query(collection(db, 'stealthPosts'), orderBy('createdAt', 'desc'), limit(40));
    const unsubPosts = onSnapshot(
      postsQuery,
      (snap) => {
        const loaded: StealthPost[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as any;
          return {
            id: d.id || docSnap.id,
            authorUid: d.authorUid,
            category: d.category || 'unlisted_drop',
            sector: d.sector || 'Frontier AI & GPU Systems',
            authorHandle: d.authorHandle || '@Verified_Operator',
            authorBadge: d.authorBadge || 'Systems Engineer',
            authorTier: d.authorTier || 'Verified Principal Architect',
            zkVerified: Boolean(d.zkVerified),
            title: d.title || '',
            content: d.content || '',
            compensationTag: d.compensationTag,
            locationTag: d.locationTag,
            tags: Array.isArray(d.tags) ? d.tags : [],
            upvotes: 0,
            downvotes: 0,
            peerVouches: 0,
            comments: [],
            timestamp: formatFirestoreTime(d.createdAt),
            isUrgent: Boolean(d.isUrgent),
            canDirectPing: Boolean(d.canDirectPing),
            contactActionLabel: 'Send Backchannel Ping',
            isLiveAts: false,
          };
        });
        setCommunityPosts(loaded);
      },
      (err) => {
        setFirestoreError(`Community feed sync error: ${err.message}`);
      }
    );

    // 3. Private ATS Notes
    const notesQuery = query(collection(db, 'users', user.uid, 'atsNotes'), orderBy('createdAt', 'desc'), limit(50));
    const unsubNotes = onSnapshot(
      notesQuery,
      (snap) => {
        const list: AtsNoteRecord[] = snap.docs.map((d) => d.data() as AtsNoteRecord);
        setAtsNotes(list);
      },
      (err) => {
        console.warn('ATS notes sync warning:', err.message);
      }
    );

    // 4. Encrypted Backchannel Pings (verified users only; split queries satisfy rules)
    let unsubInboundPings = () => {};
    let unsubOutboundPings = () => {};
    if (user.emailVerified) {
      const inboundMap = new Map<string, StealthBackchannelPing>();
      const outboundMap = new Map<string, StealthBackchannelPing>();

      const mergeAndSetPings = () => {
        const merged = new Map<string, StealthBackchannelPing>();
        inboundMap.forEach((v, k) => merged.set(k, v));
        outboundMap.forEach((v, k) => merged.set(k, v));
        setPings(Array.from(merged.values()));
      };

      const toPing = (d: any, id: string): StealthBackchannelPing => ({
        id: d.id || id,
        postId: d.postId,
        postTitle: d.postTitle,
        senderUid: d.senderUid,
        recipientUid: d.recipientUid,
        senderHandle: d.senderHandle,
        senderRole: d.senderRole,
        senderTier: d.senderTier,
        targetHandle: d.targetHandle,
        offerCompensation: d.offerCompensation,
        message: d.message,
        status: d.status || 'pending',
        timestamp: formatFirestoreTime(d.createdAt),
      });

      unsubInboundPings = onSnapshot(
        query(collection(db, 'stealthPings'), where('recipientUid', '==', user.uid)),
        (snap) => {
          inboundMap.clear();
          snap.docs.forEach((docSnap) => inboundMap.set(docSnap.id, toPing(docSnap.data(), docSnap.id)));
          mergeAndSetPings();
        },
        (err) => console.warn('Inbound pings listener warning:', err.message)
      );

      unsubOutboundPings = onSnapshot(
        query(collection(db, 'stealthPings'), where('senderUid', '==', user.uid)),
        (snap) => {
          outboundMap.clear();
          snap.docs.forEach((docSnap) => outboundMap.set(docSnap.id, toPing(docSnap.data(), docSnap.id)));
          mergeAndSetPings();
        },
        (err) => console.warn('Outbound pings listener warning:', err.message)
      );
    }

    return () => {
      unsubPersona();
      unsubPosts();
      unsubNotes();
      unsubInboundPings();
      unsubOutboundPings();
    };
  }, [user?.uid, user?.emailVerified]);

  // Active View Modes
  const [activeView, setActiveView] = useState<'feed' | 'pings' | 'my_posts'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<'all' | StealthCategory>('all');
  const [selectedSector, setSelectedSector] = useState<StealthSector>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyZkVerified, setOnlyZkVerified] = useState(false);
  const [onlyWithComp, setOnlyWithComp] = useState(false);
  const [sortBy, setSortBy] = useState<'signal' | 'latest'>('signal');

  // Expanded post comments state
  const [expandedCommentPostIds, setExpandedCommentPostIds] = useState<string[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Subscribe to comments & reactions for community posts
  useEffect(() => {
    if (!user || communityPosts.length === 0) return;

    const unsubs: Array<() => void> = [];
    const targetPosts = communityPosts.slice(0, 20);

    targetPosts.forEach((post) => {
      const reactUnsub = onSnapshot(
        collection(db, 'stealthPosts', post.id, 'reactions'),
        (snap) => {
          let upvotes = 0;
          let vouches = 0;
          let userUpvoted = false;
          let userVouched = false;
          snap.docs.forEach((d) => {
            const data = d.data() as any;
            if (data.type === 'upvote') {
              upvotes += 1;
              if (data.userId === user.uid) userUpvoted = true;
            } else if (data.type === 'vouch') {
              vouches += 1;
              if (data.userId === user.uid) userVouched = true;
            }
          });
          setReactionsByPost((prev) => ({
            ...prev,
            [post.id]: { upvotes, vouches, userUpvoted, userVouched },
          }));
        },
        () => {}
      );
      unsubs.push(reactUnsub);
    });

    expandedCommentPostIds.forEach((postId) => {
      const isCommunity = communityPosts.some((p) => p.id === postId);
      if (!isCommunity) return;
      const commentUnsub = onSnapshot(
        query(collection(db, 'stealthPosts', postId, 'comments'), orderBy('createdAt', 'asc')),
        (snap) => {
          const list: StealthComment[] = snap.docs.map((docSnap) => {
            const d = docSnap.data() as any;
            return {
              id: d.id || docSnap.id,
              authorHandle: d.authorHandle,
              authorBadge: d.authorBadge,
              authorTier: d.authorTier,
              content: d.content,
              timestamp: formatFirestoreTime(d.createdAt),
              upvotes: 0,
              isPeerVouched: true,
            };
          });
          setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
        },
        () => {}
      );
      unsubs.push(commentUnsub);
    });

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [user?.uid, communityPosts, expandedCommentPostIds]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [activePingTargetPost, setActivePingTargetPost] = useState<StealthPost | null>(null);
  const [activeNoteTargetPost, setActiveNoteTargetPost] = useState<StealthPost | null>(null);

  // ATS Note Modal Form
  const [atsNoteText, setAtsNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Ping Modal Input Form
  const [pingMessage, setPingMessage] = useState('');
  const [pingCompOffer, setPingCompOffer] = useState('');
  const [pingSentSuccess, setPingSentSuccess] = useState(false);
  const [isSendingPing, setIsSendingPing] = useState(false);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<StealthCategory>('unlisted_drop');
  const [newSector, setNewSector] = useState<StealthSector>('Frontier AI & GPU Systems');
  const [newContent, setNewContent] = useState('');
  const [newComp, setNewComp] = useState('');
  const [newLocation, setNewLocation] = useState('Remote US');
  const [newTags, setNewTags] = useState('');
  const [newIsUrgent, setNewIsUrgent] = useState(false);
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  // Feedback notifications
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const requireVerifiedUser = (actionLabel: string): boolean => {
    setFirestoreError(null);
    if (!user) {
      setFirestoreError(`Sign in to ${actionLabel}.`);
      return false;
    }
    if (!user.emailVerified) {
      setFirestoreError(
        `A verified email account (e.g. Google SSO) is required by StealthNet security rules to ${actionLabel}.`
      );
      return false;
    }
    return true;
  };

  // Filtered and Sorted Posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (activeView === 'my_posts') {
      result = result.filter((p) => (user ? p.authorUid === user.uid : p.authorHandle === userPersona.handle));
    } else {
      if (selectedCategory !== 'all') {
        result = result.filter((p) => p.category === selectedCategory);
      }
      if (selectedSector !== 'All') {
        result = result.filter((p) => p.sector === selectedSector);
      }
    }

    if (onlyZkVerified) {
      result = result.filter((p) => p.zkVerified);
    }

    if (onlyWithComp) {
      result = result.filter((p) => Boolean(p.compensationTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.authorHandle.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'signal') {
      result.sort((a, b) => b.upvotes + b.peerVouches * 2 - (a.upvotes + a.peerVouches * 2));
    } else {
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [
    posts,
    activeView,
    user,
    userPersona.handle,
    selectedCategory,
    selectedSector,
    onlyZkVerified,
    onlyWithComp,
    searchQuery,
    sortBy,
  ]);

  // Handle Upvote / Vouch against Firestore deterministic reaction doc `${uid}_${type}`
  const handleToggleReaction = async (post: StealthPost, type: 'upvote' | 'vouch') => {
    if (post.isLiveAts) {
      setFirestoreError(
        'Public ATS job feeds are read-only snapshots. Use "Log Private Note" to track live ATS targets.'
      );
      return;
    }
    if (!requireVerifiedUser(type === 'upvote' ? 'upvote community intel' : 'vouch for community intel') || !user) {
      return;
    }

    const reactionId = `${user.uid}_${type}`;
    const reactionRef = doc(db, 'stealthPosts', post.id, 'reactions', reactionId);
    const existing = reactionsByPost[post.id];
    const alreadyActive = type === 'upvote' ? existing?.userUpvoted : existing?.userVouched;

    try {
      if (alreadyActive) {
        await deleteDoc(reactionRef);
      } else {
        await setDoc(reactionRef, {
          id: reactionId,
          postId: post.id,
          userId: user.uid,
          type,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      setFirestoreError(`Reaction update failed: ${err?.message || 'Permission denied'}`);
    }
  };

  // Handle Add Comment on community Firestore post
  const handleAddComment = async (post: StealthPost) => {
    if (post.isLiveAts) {
      setFirestoreError('Public ATS boards do not host community comment threads. Save a Private Outreach Note instead.');
      return;
    }
    const text = commentInputs[post.id]?.trim();
    if (!text) return;
    if (!requireVerifiedUser('post comments') || !user) return;

    const commentId = `c-${Date.now()}`;
    try {
      await setDoc(doc(db, 'stealthPosts', post.id, 'comments', commentId), {
        id: commentId,
        postId: post.id,
        authorUid: user.uid,
        authorHandle: userPersona.handle,
        authorBadge: userPersona.badge,
        authorTier: userPersona.tier,
        content: text,
        createdAt: serverTimestamp(),
      });
      setCommentInputs((prev) => ({ ...prev, [post.id]: '' }));
    } catch (err: any) {
      setFirestoreError(`Failed to publish comment: ${err?.message || 'Unknown error'}`);
    }
  };

  const toggleCommentsExpansion = (postId: string) => {
    setExpandedCommentPostIds((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const handleToggleBookmark = (post: StealthPost) => {
    const newsItemId = `stealth-${post.id}`;
    if (isNewsSaved(newsItemId)) {
      removeNewsItem(newsItemId);
    } else {
      saveNewsItem({
        id: newsItemId,
        headline: post.title,
        company: post.authorBadge,
        sector: post.sector,
        source: `StealthNet (${post.authorTier})`,
        date: post.timestamp,
        impact: post.category === 'ground_truth' ? 'Risk' : 'Positive',
        summary: `${post.compensationTag ? `[Comp: ${post.compensationTag}] ` : ''}${post.content.slice(0, 160)}...`,
        savedAt: new Date().toISOString(),
      });
    }
  };

  const handleCopyPost = (post: StealthPost) => {
    const text = `[STEALTHNET INTEL // ${post.authorTier}]
${post.title}
Sector: ${post.sector}
Comp: ${post.compensationTag || 'Not disclosed'} | Location: ${post.locationTag || 'Unspecified'}
Handle: ${post.authorHandle} (${post.authorBadge})

${post.content}`;
    navigator.clipboard.writeText(text);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2000);
  };

  // Publish New Community StealthPost to Firestore
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || isPublishingPost) return;
    if (!requireVerifiedUser('publish StealthNet intel') || !user) return;

    setIsPublishingPost(true);
    const postId = `post-${Date.now()}`;
    const payload: Record<string, any> = {
      id: postId,
      authorUid: user.uid,
      category: newCategory,
      sector: newSector,
      authorHandle: userPersona.handle,
      authorBadge: userPersona.badge,
      authorTier: userPersona.tier,
      zkVerified: true,
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10),
      canDirectPing: true,
      isUrgent: Boolean(newIsUrgent),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (newComp.trim()) payload.compensationTag = newComp.trim();
    if (newLocation.trim()) payload.locationTag = newLocation.trim();

    try {
      await setDoc(doc(db, 'stealthPosts', postId), payload);
      setNewTitle('');
      setNewContent('');
      setNewComp('');
      setNewTags('');
      setNewIsUrgent(false);
      setShowCreateModal(false);
    } catch (err: any) {
      setFirestoreError(`Failed to publish StealthNet post: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsPublishingPost(false);
    }
  };

  // Send Encrypted Backchannel Ping via Firestore stealthPings
  const handleSendPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePingTargetPost || !pingMessage.trim() || isSendingPing) return;
    if (!requireVerifiedUser('send encrypted backchannel pings') || !user) return;

    const recipientUid = activePingTargetPost.authorUid;
    if (!recipientUid || recipientUid === user.uid) {
      setFirestoreError(
        recipientUid === user.uid
          ? 'You cannot send a backchannel handshake ping to your own post.'
          : 'This item does not have a verified peer UID recipient.'
      );
      return;
    }

    setIsSendingPing(true);
    const pingId = `ping-${Date.now()}`;
    const payload: Record<string, any> = {
      id: pingId,
      postId: activePingTargetPost.id,
      postTitle: activePingTargetPost.title.slice(0, 200),
      senderUid: user.uid,
      recipientUid,
      senderHandle: userPersona.handle,
      senderRole: userPersona.badge,
      senderTier: userPersona.tier,
      targetHandle: activePingTargetPost.authorHandle,
      message: pingMessage.trim().slice(0, 1500),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (pingCompOffer.trim()) {
      payload.offerCompensation = pingCompOffer.trim().slice(0, 80);
    }

    try {
      await setDoc(doc(db, 'stealthPings', pingId), payload);
      setPingSentSuccess(true);
      setTimeout(() => {
        setPingSentSuccess(false);
        setActivePingTargetPost(null);
        setPingMessage('');
        setPingCompOffer('');
      }, 1500);
    } catch (err: any) {
      setFirestoreError(`Failed to dispatch encrypted ping: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsSendingPing(false);
    }
  };

  // Save Private Outreach Note on Live ATS card to users/{uid}/atsNotes
  const handleSaveAtsNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteTargetPost || !atsNoteText.trim() || isSavingNote) return;
    if (!user) {
      setFirestoreError('Sign in to save private outreach notes for live ATS roles.');
      return;
    }

    setIsSavingNote(true);
    const noteId = `note-${Date.now()}`;
    const payload: Record<string, any> = {
      id: noteId,
      userId: user.uid,
      atsPostId: activeNoteTargetPost.id,
      company: activeNoteTargetPost.companyName || activeNoteTargetPost.authorHandle,
      roleTitle: activeNoteTargetPost.title.slice(0, 200),
      note: atsNoteText.trim().slice(0, 1500),
      createdAt: serverTimestamp(),
    };
    if (activeNoteTargetPost.externalUrl) {
      payload.externalUrl = activeNoteTargetPost.externalUrl.slice(0, 500);
    }

    try {
      await setDoc(doc(db, 'users', user.uid, 'atsNotes', noteId), payload);
      setAtsNoteText('');
      setActiveNoteTargetPost(null);
    } catch (err: any) {
      setFirestoreError(`Failed to save private ATS note: ${err?.message || 'Permission denied'}`);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Save Stealth Persona to Firestore users/{uid}/stealthPersona/profile
  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirestoreError(null);
    if (!user) {
      setFirestoreError('Sign in to persist your StealthNet persona.');
      setShowPersonaModal(false);
      return;
    }
    try {
      await setDoc(doc(db, 'users', user.uid, 'stealthPersona', 'profile'), {
        userId: user.uid,
        handle: userPersona.handle,
        tier: userPersona.tier,
        badge: userPersona.badge,
        disclosureLevel: userPersona.disclosureLevel,
        bio: userPersona.bio || '',
        primaryStack: Array.isArray(userPersona.primaryStack) ? userPersona.primaryStack.slice(0, 15) : [],
        minCompensationFloor: userPersona.minCompensationFloor || '$450,000 Base+Equity',
        openToBackchannel: Boolean(userPersona.openToBackchannel),
        updatedAt: serverTimestamp(),
      });
      setShowPersonaModal(false);
    } catch (err: any) {
      setFirestoreError(`Failed to save Stealth Persona: ${err?.message || 'Permission denied'}`);
    }
  };

  // Accept/Decline inbound ping in Firestore
  const handlePingAction = async (pingId: string, status: 'accepted' | 'declined') => {
    if (!requireVerifiedUser('update encrypted handshake status') || !user) return;
    try {
      await updateDoc(doc(db, 'stealthPings', pingId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setFirestoreError(`Failed to update ping status: ${err?.message || 'Permission denied'}`);
    }
  };

  const pendingPingsCount = pings.filter((p) => p.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Top Banner / Hero Console */}
      <div className="panel bg-gradient-to-br from-[#0a0f14] via-[#111a22] to-[#152332] border border-[#1e2b36] rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-bl from-[#22d3a5]/10 via-[#3b82f6]/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30 font-bold tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                FIRESTORE VERIFIED COMMUNITY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30 font-semibold">
                LIVE 14-BOARD ATS WIRE
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-mono text-[#dce7f0] flex items-center gap-2.5">
              <EyeOff className="w-6 h-6 text-[#22d3a5]" />
              STEALTHNET // VERIFIED WIRE &amp; LIVE ATS SIGNALS
            </h1>
            <p className="text-xs text-[#7a8b99] font-mono mt-1 max-w-3xl">
              Real-time Firestore community intelligence combined with live Ashby, Greenhouse &amp; Lever corporate engineering boards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto font-mono text-xs">
            <div
              onClick={() => setShowPersonaModal(true)}
              className="cursor-pointer p-2.5 rounded-lg bg-[#0a0f14]/80 border border-[#1e2b36] hover:border-[#22d3a5] transition flex items-center gap-2.5 text-left group"
              title="Click to adjust your stealth persona & credentials"
            >
              <div className="w-8 h-8 rounded-full bg-[#1e2b36] border border-[#22d3a5]/50 flex items-center justify-center text-[#22d3a5] font-bold group-hover:scale-105 transition">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#dce7f0] font-bold">{userPersona.handle}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
                </div>
                <div className="text-[10px] text-[#22d3a5] truncate max-w-[150px]">
                  {userPersona.tier}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7a8b99] group-hover:text-[#22d3a5] transition ml-1" />
            </div>

            <button
              onClick={() => {
                if (requireVerifiedUser('publish StealthNet intel')) {
                  setShowCreateModal(true);
                }
              }}
              className="px-3 py-2 rounded-lg bg-[#22d3a5] text-[#0a0f14] font-bold hover:bg-[#1db890] transition shadow-[0_0_15px_rgba(34,211,165,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Intel / Pitch</span>
            </button>
          </div>
        </div>

        {/* Computed Real-Time Market Pulse Bar */}
        <div className="mt-4 pt-3 border-t border-[#1e2b36] grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
          <div className="p-2 rounded bg-[#0a0f14]/60 border border-[#1e2b36]/60">
            <div className="text-[#7a8b99] text-[10px]">FRONTIER AI &amp; COMPUTE</div>
            <div className="text-[#22d3a5] font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#f87171]" /> {livePulseMetrics.frontierCount} Active Signals
            </div>
          </div>
          <div className="p-2 rounded bg-[#0a0f14]/60 border border-[#1e2b36]/60">
            <div className="text-[#7a8b99] text-[10px]">DUAL-USE DEFENSE</div>
            <div className="text-[#22d3a5] font-bold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#3b82f6]" /> {livePulseMetrics.defenseCount} Active Signals
            </div>
          </div>
          <div className="p-2 rounded bg-[#0a0f14]/60 border border-[#1e2b36]/60">
            <div className="text-[#7a8b99] text-[10px]">DISTRIBUTED CLOUD</div>
            <div className="text-[#fbbf24] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#fbbf24]" /> {livePulseMetrics.cloudCount} Active Signals
            </div>
          </div>
          <div className="p-2 rounded bg-[#0a0f14]/60 border border-[#1e2b36]/60">
            <div className="text-[#7a8b99] text-[10px]">DISCLOSED COMP TAGS</div>
            <div className="text-[#3b82f6] font-bold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#22d3a5]" /> {livePulseMetrics.disclosedCompCount} Verified Posts
            </div>
          </div>
        </div>
      </div>

      {!user && (
        <div className="p-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/40 text-[#93c5fd] text-xs font-mono flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Viewing live external ATS company wire. Sign in with a verified Google/Email account to sync community StealthNet posts, upvote/vouch reactions, and private outreach notes.
          </span>
        </div>
      )}

      {(atsError || firestoreError) && (
        <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{atsError || firestoreError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAtsError(null);
              setFirestoreError(null);
            }}
            className="text-red-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Views */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e2b36] pb-3">
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveView('feed')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'feed'
                ? 'bg-[#15222e] text-[#22d3a5] border-[#22d3a5]'
                : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Public Market Wire</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#0a0f14] text-[10px] text-[#22d3a5] border border-[#1e2b36]">
              {posts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView('pings')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 relative cursor-pointer ${
              activeView === 'pings'
                ? 'bg-[#15222e] text-[#22d3a5] border-[#22d3a5]'
                : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Encrypted Pings</span>
            {pendingPingsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#f87171] text-[10px] text-[#0a0f14] font-bold animate-pulse">
                {pendingPingsCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('my_posts')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'my_posts'
                ? 'bg-[#15222e] text-[#22d3a5] border-[#22d3a5]'
                : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Stealth Activity</span>
          </button>
        </div>

        {activeView === 'feed' && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {atsMeta?.isLive && (
              <span className="px-2 py-1 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 text-[10px] font-bold">
                LIVE ATS WIRE • {atsMeta.boardsSucceeded} BOARDS • {atsMeta.totalOpeningsAcrossBoards.toLocaleString()} OPENINGS
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchLiveStealthFeed(true)}
              disabled={isRefreshingAts}
              className="px-2.5 py-1 rounded border border-[#1e2b36] bg-[#0a0f14] hover:border-[#22d3a5] text-[#22d3a5] text-[11px] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingAts ? 'animate-spin' : ''}`} />
              <span>{isRefreshingAts ? 'Refreshing ATS...' : 'Refresh Live ATS'}</span>
            </button>
            <span className="text-[#7a8b99] text-[11px] ml-1">SORT:</span>
            <button
              onClick={() => setSortBy('signal')}
              className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                sortBy === 'signal'
                  ? 'bg-[#0a0f14] text-[#22d3a5] border-[#22d3a5]'
                  : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36]'
              }`}
            >
              Highest Signal
            </button>
            <button
              onClick={() => setSortBy('latest')}
              className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                sortBy === 'latest'
                  ? 'bg-[#0a0f14] text-[#22d3a5] border-[#22d3a5]'
                  : 'bg-[#111a22] text-[#7a8b99] border-[#1e2b36]'
              }`}
            >
              Latest
            </button>
          </div>
        )}
      </div>

      {/* Encrypted Pings View */}
      {activeView === 'pings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-mono text-[#dce7f0] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#3b82f6]" />
                  FIRESTORE-ISOLATED BACKCHANNEL INBOX
                </h3>
                <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
                  Direct inquiries routed strictly between verified sender and recipient UIDs.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5]">
                {pings.length} Inquiries
              </span>
            </div>
          </div>

          {pings.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#1e2b36] rounded-xl text-[#7a8b99] font-mono">
              <Lock className="w-8 h-8 mx-auto mb-2 text-[#7a8b99]/40" />
              <p>No encrypted backchannel pings yet.</p>
              <p className="text-xs mt-1 text-[#7a8b99]/70">
                Publish a community StealthNet post or ping another verified peer&apos;s pitch to start a thread.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {pings.map((ping) => {
                const isRecipient = user?.uid && ping.recipientUid === user.uid;
                return (
                  <div
                    key={ping.id}
                    className="p-4 rounded-xl bg-[#111a22] border border-[#1e2b36] hover:border-[#3b82f6]/50 transition font-mono space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#22d3a5]" />
                        <span className="text-sm font-bold text-[#dce7f0]">{ping.senderHandle}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30">
                          {ping.senderTier}
                        </span>
                        <span className="text-xs text-[#7a8b99]">({ping.senderRole})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#7a8b99]">{ping.timestamp}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ping.status === 'accepted'
                              ? 'bg-[#22d3a5]/20 text-[#22d3a5]'
                              : ping.status === 'declined'
                              ? 'bg-[#f87171]/20 text-[#f87171]'
                              : 'bg-[#fbbf24]/20 text-[#fbbf24]'
                          }`}
                        >
                          {ping.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#7a8b99]">
                      <span className="text-[#3b82f6] font-semibold">RE: </span>
                      <span className="text-[#dce7f0]">{ping.postTitle}</span>
                    </div>

                    {ping.offerCompensation && (
                      <div className="p-2 rounded bg-[#0a0f14] border border-[#22d3a5]/30 text-xs text-[#22d3a5] flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#22d3a5]" />
                        <span className="font-bold">Proposed Comp Range:</span>
                        <span>{ping.offerCompensation}</span>
                      </div>
                    )}

                    <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#dce7f0] leading-relaxed">
                      {ping.message}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {ping.status === 'pending' && isRecipient ? (
                        <>
                          <button
                            onClick={() => handlePingAction(ping.id, 'declined')}
                            className="px-3 py-1.5 rounded-lg border border-[#1e2b36] text-[#7a8b99] hover:text-[#f87171] hover:border-[#f87171] transition text-xs cursor-pointer"
                          >
                            Decline Politely
                          </button>
                          <button
                            onClick={() => handlePingAction(ping.id, 'accepted')}
                            className="px-3 py-1.5 rounded-lg bg-[#22d3a5] text-[#0a0f14] font-bold hover:bg-[#1db890] transition text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Accept &amp; Open Encrypted Tunnel
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-[#7a8b99]">
                          {ping.status === 'pending'
                            ? 'Awaiting recipient response.'
                            : `Handshake status: ${ping.status}.`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Feed or My Activity View */}
      {activeView !== 'pings' && (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#22d3a5] text-[#0a0f14] font-bold shadow-[0_0_12px_rgba(34,211,165,0.25)]'
                    : 'bg-[#111a22] text-[#7a8b99] border border-[#1e2b36] hover:text-[#dce7f0] hover:border-[#3b82f6]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#111a22] border border-[#1e2b36] grid grid-cols-1 md:grid-cols-12 gap-3 font-mono text-xs">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#7a8b99]" />
              <input
                type="text"
                placeholder="Search stacks, tags, unlisted roles, orgs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] placeholder-[#7a8b99] text-xs font-mono rounded-lg pl-9 pr-3 py-2 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="md:col-span-4">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value as StealthSector)}
                aria-label="Filter by Sector"
                className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none transition"
              >
                {SECTORS.map((sec) => (
                  <option key={sec} value={sec} className="bg-[#111a22]">
                    Sector: {sec}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-center justify-between sm:justify-end gap-2">
              <button
                onClick={() => setOnlyZkVerified(!onlyZkVerified)}
                className={`px-2 py-1.5 rounded-lg border text-[11px] transition flex items-center gap-1 cursor-pointer ${
                  onlyZkVerified
                    ? 'bg-[#22d3a5]/15 text-[#22d3a5] border-[#22d3a5]'
                    : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ZK-Verified</span>
              </button>

              <button
                onClick={() => setOnlyWithComp(!onlyWithComp)}
                className={`px-2 py-1.5 rounded-lg border text-[11px] transition flex items-center gap-1 cursor-pointer ${
                  onlyWithComp
                    ? 'bg-[#22d3a5]/15 text-[#22d3a5] border-[#22d3a5]'
                    : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Has Comp Tag</span>
              </button>
            </div>
          </div>

          {isLoadingAts && filteredPosts.length === 0 ? (
            <div className="p-12 text-center border border-[#1e2b36] rounded-xl bg-[#111a22] text-[#22d3a5] font-mono space-y-2">
              <RefreshCw className="w-7 h-7 mx-auto animate-spin" />
              <p className="text-xs font-bold">SCRAPING LIVE ASHBY, GREENHOUSE &amp; LEVER ATS BOARDS...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-[#1e2b36] rounded-xl text-[#7a8b99] font-mono">
              <Users className="w-8 h-8 mx-auto mb-2 text-[#7a8b99]/40" />
              <p>No intelligence briefs match your current filter parameters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSector('All');
                  setSearchQuery('');
                  setOnlyZkVerified(false);
                  setOnlyWithComp(false);
                }}
                className="mt-3 px-3 py-1.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#22d3a5] text-xs hover:border-[#22d3a5] transition cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isBookmarked = isNewsSaved(`stealth-${post.id}`);
                const reactionInfo = reactionsByPost[post.id];
                const isUpvoted = Boolean(reactionInfo?.userUpvoted);
                const isVouched = Boolean(reactionInfo?.userVouched);
                const isCommentsOpen = expandedCommentPostIds.includes(post.id);
                const postNotes = atsNotes.filter((n) => n.atsPostId === post.id);

                return (
                  <div
                    key={post.id}
                    className="panel bg-[#111a22] border border-[#1e2b36] hover:border-[#3b82f6]/40 rounded-xl p-5 shadow-lg transition duration-200 font-mono space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2b36] pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            post.category === 'unlisted_drop'
                              ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40'
                              : post.category === 'comp_intel'
                              ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/40'
                              : post.category === 'ground_truth'
                              ? 'bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/40'
                              : post.category === 'candidate_pitch'
                              ? 'bg-[#a855f7]/20 text-[#c084fc] border border-[#a855f7]/40'
                              : 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40'
                          }`}
                        >
                          {post.category.replace('_', ' ')}
                        </span>

                        <span className="text-[10px] text-[#7a8b99] px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36]">
                          {post.sector}
                        </span>

                        {post.isLiveAts && post.sourceAts && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/30 font-bold uppercase">
                            LIVE {post.sourceAts} ATS
                          </span>
                        )}

                        {post.isUrgent && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#f87171] text-[#0a0f14] font-bold flex items-center gap-1">
                            <Flame className="w-3 h-3" /> ACTIVE HIRING
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#7a8b99]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{post.timestamp}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#0a0f14] border border-[#22d3a5]/40 flex items-center justify-center text-[#22d3a5] text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#dce7f0]">
                              {post.authorHandle}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 flex items-center gap-0.5">
                              <BadgeCheck className="w-3 h-3" /> {post.authorTier}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7a8b99]">
                            {post.authorBadge}
                          </div>
                        </div>
                      </div>

                      {!post.isLiveAts && (
                        <div
                          className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 ${
                            post.peerVouches > 10
                              ? 'bg-[#22d3a5]/10 text-[#22d3a5] border-[#22d3a5]/30'
                              : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36]'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{post.peerVouches} Peer Vouches</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#dce7f0] leading-snug">
                      {post.title}
                    </h3>

                    {(post.compensationTag || post.locationTag) && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {post.compensationTag && (
                          <div className="px-2.5 py-1 rounded bg-[#0a0f14] border border-[#22d3a5]/40 text-[#22d3a5] text-xs font-bold flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{post.compensationTag}</span>
                          </div>
                        )}
                        {post.locationTag && (
                          <div className="px-2.5 py-1 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] text-xs flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
                            <span>{post.locationTag}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-line bg-[#0a0f14]/40 p-3 rounded-lg border border-[#1e2b36]/60">
                      {post.content}
                    </div>

                    {postNotes.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-[#0d1d2b] border border-[#38bdf8]/40 space-y-1.5 text-[11px]">
                        <div className="text-[#38bdf8] font-bold flex items-center gap-1.5">
                          <StickyNote className="w-3.5 h-3.5" />
                          <span>YOUR PRIVATE ATS OUTREACH NOTES ({postNotes.length})</span>
                        </div>
                        {postNotes.map((n) => (
                          <div key={n.id} className="text-[#dce7f0] bg-[#0a0f14] p-2 rounded border border-[#1e2b36]">
                            {n.note}
                          </div>
                        ))}
                      </div>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0a0f14] text-[#7a8b99] border border-[#1e2b36] hover:border-[#22d3a5] hover:text-[#22d3a5] transition cursor-pointer"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1e2b36] text-xs">
                      <div className="flex items-center gap-2">
                        {!post.isLiveAts && (
                          <>
                            <button
                              onClick={() => handleToggleReaction(post, 'upvote')}
                              className={`px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                                isUpvoted
                                  ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                                  : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
                              }`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{post.upvotes}</span>
                            </button>

                            <button
                              onClick={() => handleToggleReaction(post, 'vouch')}
                              className={`px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                                isVouched
                                  ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]'
                                  : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{isVouched ? 'Vouched' : 'Vouch'}</span>
                            </button>

                            <button
                              onClick={() => toggleCommentsExpansion(post.id)}
                              className={`px-2.5 py-1.5 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                                isCommentsOpen
                                  ? 'bg-[#15222e] text-[#22d3a5] border-[#22d3a5]'
                                  : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{post.comments.length} Comments</span>
                            </button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleBookmark(post)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isBookmarked
                              ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]'
                              : 'bg-[#0a0f14] text-[#7a8b99] border-[#1e2b36] hover:text-[#dce7f0]'
                          }`}
                          title={isBookmarked ? 'Saved in Bookmarks' : 'Save Intel to Bookmarks'}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleCopyPost(post)}
                          className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] transition cursor-pointer"
                          title="Copy Intel Brief"
                        >
                          {copiedPostId === post.id ? (
                            <Check className="w-4 h-4 text-[#22d3a5]" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>

                        {post.isLiveAts && post.externalUrl && (
                          <a
                            href={post.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#22d3a5] text-[#0a0f14] font-bold hover:bg-[#1db890] transition flex items-center gap-1.5 shadow"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Inspect Live ATS</span>
                          </a>
                        )}

                        {post.isLiveAts ? (
                          <button
                            onClick={() => {
                              if (!user) {
                                setFirestoreError('Sign in to save private outreach notes for live ATS roles.');
                                return;
                              }
                              setActiveNoteTargetPost(post);
                              setAtsNoteText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 font-bold hover:bg-[#38bdf8]/30 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            <span>Log Private Note</span>
                          </button>
                        ) : (
                          post.canDirectPing &&
                          post.authorUid &&
                          post.authorUid !== user?.uid && (
                            <button
                              onClick={() => {
                                if (!isPro) {
                                  openPaywall('StealthNet Zero-Knowledge Headhunter Direct Outreach');
                                  return;
                                }
                                if (requireVerifiedUser('send encrypted pings')) {
                                  setActivePingTargetPost(post);
                                  setPingMessage('');
                                  setPingCompOffer(post.compensationTag || '');
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#3b82f6] text-[#0a0f14] font-bold hover:bg-[#2563eb] transition flex items-center gap-1.5 cursor-pointer shadow"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{post.contactActionLabel || 'Send Backchannel Ping'}</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Expandable Comments Drawer (Community Posts) */}
                    {isCommentsOpen && !post.isLiveAts && (
                      <div className="mt-3 pt-3 border-t border-[#1e2b36] space-y-3 bg-[#0a0f14]/50 p-3 rounded-lg">
                        <div className="flex items-center justify-between text-xs text-[#7a8b99]">
                          <span className="font-bold text-[#dce7f0] flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-[#22d3a5]" />
                            VERIFIED THREAD DISCUSSION
                          </span>
                          <span>{post.comments.length} verified responses</span>
                        </div>

                        {post.comments.length > 0 ? (
                          <div className="space-y-2">
                            {post.comments.map((comment) => (
                              <div
                                key={comment.id}
                                className="p-2.5 rounded bg-[#111a22] border border-[#1e2b36] text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#22d3a5] font-bold">
                                      {comment.authorHandle}
                                    </span>
                                    <span className="text-[10px] text-[#7a8b99]">
                                      [{comment.authorTier}]
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-[#7a8b99]">
                                    {comment.timestamp}
                                  </span>
                                </div>
                                <div className="text-[#dce7f0] leading-relaxed">
                                  {comment.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[#7a8b99] py-2">
                            No comments yet. Start the verified discussion below.
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={`Reply as ${userPersona.handle}...`}
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post)}
                            className="flex-1 bg-[#111a22] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none transition"
                          />
                          <button
                            onClick={() => handleAddComment(post)}
                            className="px-3 py-2 rounded-lg bg-[#22d3a5] text-[#0a0f14] font-bold hover:bg-[#1db890] transition text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal 1: Create Stealth Post / Pitch */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel bg-[#111a22] border border-[#22d3a5]/50 rounded-xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#22d3a5]" />
                <h3 className="text-base font-bold text-[#dce7f0]">
                  PUBLISH STEALTH INTEL / CANDIDATE PITCH
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishPost} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7a8b99] mb-1 font-semibold">CHANNEL CATEGORY</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as StealthCategory)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none"
                  >
                    <option value="unlisted_drop">🚀 Unlisted Job Drop</option>
                    <option value="comp_intel">💼 Compensation &amp; Leveling Intel</option>
                    <option value="ground_truth">🕵️ Ground Truth / Restructuring Leak</option>
                    <option value="candidate_pitch">🎯 Stealth Candidate Pitch</option>
                    <option value="tech_debate">💡 Architecture &amp; Production War Stories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#7a8b99] mb-1 font-semibold">MARKET SECTOR</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value as StealthSector)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none"
                  >
                    {SECTORS.filter((s) => s !== 'All').map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1 font-semibold">POST HEADLINE / TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. [Stealth Candidate] Staff Distributed Systems Lead Seeking Series B..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#7a8b99] mb-1">COMPENSATION TAG (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="e.g. $420k - $550k TC + Equity"
                    value={newComp}
                    onChange={(e) => setNewComp(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#7a8b99] mb-1">LOCATION / REMOTE POLICY</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote US, SF Bay Area, NYC"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1 font-semibold">BODY INTEL &amp; DETAILS</label>
                <textarea
                  rows={4}
                  placeholder="Share compensation breakdowns, engineering constraints, or pitch parameters..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1">STACK &amp; TOPIC TAGS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  placeholder="e.g. CUDA, PyTorch, C++, Zero Trust, Series B"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#22d3a5] text-[#dce7f0] rounded-lg p-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishingPost}
                  className="px-4 py-2 rounded-lg bg-[#22d3a5] text-[#0a0f14] font-bold hover:bg-[#1db890] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isPublishingPost ? 'Publishing...' : 'Publish to Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User Stealth Persona & Credentials */}
      {showPersonaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel bg-[#111a22] border border-[#3b82f6]/50 rounded-xl p-5 w-full max-w-lg shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="text-base font-bold text-[#dce7f0]">
                  MANAGE STEALTH PERSONA &amp; PRIVACY
                </h3>
              </div>
              <button
                onClick={() => setShowPersonaModal(false)}
                className="text-[#7a8b99] hover:text-[#dce7f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePersona} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#7a8b99] mb-1 font-semibold">ANONYMOUS PSEUDONYM / HANDLE</label>
                <input
                  type="text"
                  required
                  value={userPersona.handle}
                  onChange={(e) => setUserPersona({ ...userPersona, handle: e.target.value })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1 font-semibold">VERIFIED EMPLOYER / DOMAIN TIER</label>
                <select
                  value={userPersona.tier}
                  onChange={(e) => setUserPersona({ ...userPersona, tier: e.target.value as VerificationTier })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none"
                >
                  {VERIFICATION_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1">TITLE / SPECIALIZATION BADGE</label>
                <input
                  type="text"
                  required
                  value={userPersona.badge}
                  onChange={(e) => setUserPersona({ ...userPersona, badge: e.target.value })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1">DISCLOSURE LEVEL</label>
                <select
                  value={userPersona.disclosureLevel}
                  onChange={(e) =>
                    setUserPersona({
                      ...userPersona,
                      disclosureLevel: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none"
                >
                  <option value="Pure Stealth (Masked)">Pure Stealth (Masked - Handle Only)</option>
                  <option value="Verified Tier (Standard)">Verified Tier (Standard - Tier Badge Visible)</option>
                  <option value="Selective Decrypt (Recruiters)">Selective Decrypt (Vetted Recruiters Can Request Handshake)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1">TARGET COMPENSATION FLOOR</label>
                <input
                  type="text"
                  value={userPersona.minCompensationFloor}
                  onChange={(e) =>
                    setUserPersona({ ...userPersona, minCompensationFloor: e.target.value })
                  }
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1">STEALTH BIO &amp; SPECIALIZATION FOCUS</label>
                <textarea
                  rows={3}
                  value={userPersona.bio}
                  onChange={(e) => setUserPersona({ ...userPersona, bio: e.target.value })}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setShowPersonaModal(false)}
                  className="px-3 py-2 rounded-lg border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#3b82f6] text-[#0a0f14] font-bold hover:bg-[#2563eb] transition cursor-pointer"
                >
                  Save Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Send Encrypted Backchannel Inquiry */}
      {activePingTargetPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel bg-[#111a22] border border-[#3b82f6]/50 rounded-xl p-5 w-full max-w-lg shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#3b82f6]" />
                <h3 className="text-base font-bold text-[#dce7f0]">
                  DISCREET BACKCHANNEL INQUIRY
                </h3>
              </div>
              <button
                onClick={() => setActivePingTargetPost(null)}
                className="text-[#7a8b99] hover:text-[#dce7f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pingSentSuccess ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#22d3a5] mx-auto animate-bounce" />
                <h4 className="text-sm font-bold text-[#dce7f0]">
                  ENCRYPTED PING DISPATCHED
                </h4>
                <p className="text-xs text-[#7a8b99]">
                  Persisted securely to {activePingTargetPost.authorHandle}&apos;s isolated inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendPing} className="space-y-3.5 text-xs">
                <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                  <div className="text-[10px] text-[#7a8b99]">TARGET THREAD:</div>
                  <div className="text-sm font-bold text-[#dce7f0]">{activePingTargetPost.title}</div>
                  <div className="text-[11px] text-[#22d3a5]">
                    Recipient: {activePingTargetPost.authorHandle} ({activePingTargetPost.authorTier})
                  </div>
                </div>

                <div>
                  <label className="block text-[#7a8b99] mb-1 font-semibold">
                    COMPENSATION RANGE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $450,000 Base + Equity"
                    value={pingCompOffer}
                    onChange={(e) => setPingCompOffer(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[#7a8b99] mb-1 font-semibold">
                    DISCREET MESSAGE / PROPOSAL
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Explain why your mission matches their expertise."
                    value={pingMessage}
                    onChange={(e) => setPingMessage(e.target.value)}
                    required
                    className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#3b82f6] text-[#dce7f0] rounded-lg p-2 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                  <button
                    type="button"
                    onClick={() => setActivePingTargetPost(null)}
                    className="px-3 py-2 rounded-lg border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingPing}
                    className="px-4 py-2 rounded-lg bg-[#3b82f6] text-[#0a0f14] font-bold hover:bg-[#2563eb] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSendingPing ? 'Sending...' : 'Send Encrypted Ping'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 4: Log Private Outreach Note for Live ATS Card */}
      {activeNoteTargetPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel bg-[#111a22] border border-[#38bdf8]/50 rounded-xl p-5 w-full max-w-lg shadow-2xl font-mono space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="text-base font-bold text-[#dce7f0]">
                  LOG PRIVATE ATS OUTREACH NOTE
                </h3>
              </div>
              <button
                onClick={() => setActiveNoteTargetPost(null)}
                className="text-[#7a8b99] hover:text-[#dce7f0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAtsNote} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#1e2b36]">
                <div className="text-[10px] text-[#7a8b99]">LIVE ATS TARGET:</div>
                <div className="text-sm font-bold text-[#dce7f0]">{activeNoteTargetPost.title}</div>
                <div className="text-[11px] text-[#38bdf8]">
                  {activeNoteTargetPost.companyName || activeNoteTargetPost.authorHandle}
                </div>
              </div>

              <div>
                <label className="block text-[#7a8b99] mb-1 font-semibold">
                  PRIVATE FOLLOW-UP / REFERRAL NOTE *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Track hiring manager outreach, referral contact, or ATS application date..."
                  value={atsNoteText}
                  onChange={(e) => setAtsNoteText(e.target.value)}
                  className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] text-[#dce7f0] rounded-lg p-2.5 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2b36]">
                <button
                  type="button"
                  onClick={() => setActiveNoteTargetPost(null)}
                  className="px-3 py-2 rounded-lg border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote || !atsNoteText.trim()}
                  className="px-4 py-2 rounded-lg bg-[#38bdf8] text-black font-bold hover:bg-[#0284c7] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingNote ? 'Saving...' : 'Save Private Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
