import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, isFirestorePermissionError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { JobAlert } from '../utils/radarEngine';

export interface JobAlertCriteria {
  keywords: string;
  location: string;
  minSalary: number;
  maxSalary: number;
  urgency?: string;
}

export interface JobAlertSubscription {
  id: string;
  title: string;
  criteria: JobAlertCriteria;
  frequency: 'Real-time' | 'Daily Digest' | 'Orbital Intercept';
  createdAt: string;
  lastTriggeredAt?: string;
  matchCount: number;
  isActive: boolean;
}

export interface LiveJobNotification {
  id: string;
  alertId: string;
  alertTitle: string;
  job: JobAlert;
  headline: string;
  timestamp: string;
  isRead: boolean;
}

export type SimulatedJobNotification = LiveJobNotification;

interface JobAlertsContextType {
  subscriptions: JobAlertSubscription[];
  notifications: LiveJobNotification[];
  unreadCount: number;
  isCloudSynced: boolean;
  isScanning: boolean;
  scanError: string | null;
  subscribeToAlert: (criteria: JobAlertCriteria, customTitle?: string) => JobAlertSubscription;
  unsubscribeFromAlert: (id: string) => void;
  toggleSubscriptionActive: (id: string) => void;
  isSubscribedToCriteria: (criteria: JobAlertCriteria) => boolean;
  scanLiveAtsMatches: (subscriptionId?: string) => Promise<LiveJobNotification | null>;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const STORAGE_KEY_SUBSCRIPTIONS = 'talent_radar_job_subscriptions_v2';
const STORAGE_KEY_NOTIFICATIONS = 'talent_radar_live_notifications_v2';

const JobAlertsContext = createContext<JobAlertsContextType | undefined>(undefined);

function formatFirestoreDate(ts: any): string {
  if (!ts) return 'Just now';
  if (typeof ts?.toDate === 'function') {
    return ts.toDate().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof ts === 'string') return ts;
  return 'Just now';
}

export function JobAlertsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<JobAlertSubscription[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const [notifications, setNotifications] = useState<LiveJobNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Sync from Firestore in real-time ONLY when authenticated
  useEffect(() => {
    if (!user?.uid) {
      try {
        const savedSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
        const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
        setSubscriptions(savedSubs ? JSON.parse(savedSubs) : []);
        setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
      } catch {
        setSubscriptions([]);
        setNotifications([]);
      }
      return;
    }

    const alertsRef = collection(db, 'users', user.uid, 'jobAlerts');
    const notifsRef = collection(db, 'users', user.uid, 'alertNotifications');

    const unsubAlerts = onSnapshot(
      query(alertsRef, orderBy('updatedAt', 'desc')),
      (snapshot) => {
        const mapped: JobAlertSubscription[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id || d.id,
            title: String(data.title || 'Live ATS Criteria'),
            criteria: {
              keywords: String(data.keywords || ''),
              location: String(data.location || 'All'),
              minSalary: Number(data.minSalary || 0),
              maxSalary: Number(data.maxSalary || 600000),
              urgency: String(data.urgency || 'All'),
            },
            frequency: 'Real-time',
            createdAt: formatFirestoreDate(data.createdAt),
            lastTriggeredAt: formatFirestoreDate(data.updatedAt),
            matchCount: Number(data.matchCount || 0),
            isActive: Boolean(data.active),
          };
        });
        setSubscriptions(mapped);
      },
      (err) => {
        if (isFirestorePermissionError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/jobAlerts`);
        }
      }
    );

    const unsubNotifs = onSnapshot(
      query(notifsRef, orderBy('createdAt', 'desc')),
      (snapshot) => {
        const mapped: LiveJobNotification[] = snapshot.docs.map((d) => {
          const data = d.data();
          const salaryLabel = String(data.salaryLabel || 'Comp Disclosed on ATS');
          const job: JobAlert = {
            id: String(data.jobId || d.id),
            title: String(data.jobTitle || 'Technical Role'),
            company: String(data.company || 'ATS Organization'),
            location: String(data.location || 'Remote / Hybrid'),
            coordinates: [37.7749, -122.4194],
            salaryRange: salaryLabel,
            numericMinSalary: 0,
            numericMaxSalary: 0,
            sector: 'Live External ATS',
            type: 'Full-Time',
            urgency: (data.urgency as any) || 'HIGH PRIORITY',
            matchScore: 95,
            skills: [],
            postedAgo: formatFirestoreDate(data.createdAt),
            headcountDelta: 'Verified ATS Signal',
            description: `Matched via live external ATS scan for criteria "${data.matchedCriteriaLabel || 'Alert'}".`,
            applyUrl: data.applyUrl || undefined,
            sourceAts: 'ashby',
          };
          return {
            id: data.id || d.id,
            alertId: String(data.subscriptionId || ''),
            alertTitle: String(data.matchedCriteriaLabel || 'Live ATS Alert'),
            job,
            headline: `LIVE ATS MATCH // ${job.title} at ${job.company}`,
            timestamp: formatFirestoreDate(data.createdAt),
            isRead: Boolean(data.isRead),
          };
        });
        setNotifications(mapped);
      },
      (err) => {
        if (isFirestorePermissionError(err)) {
          handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/alertNotifications`);
        }
      }
    );

    return () => {
      unsubAlerts();
      unsubNotifs();
    };
  }, [user?.uid]);

  // Persist guest sessions cleanly in localStorage only when signed out
  useEffect(() => {
    if (user?.uid) return;
    try {
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subscriptions));
    } catch {
      // Ignore
    }
  }, [subscriptions, user?.uid]);

  useEffect(() => {
    if (user?.uid) return;
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    } catch {
      // Ignore
    }
  }, [notifications, user?.uid]);

  const isSubscribedToCriteria = useCallback(
    (criteria: JobAlertCriteria): boolean => {
      return subscriptions.some(
        (sub) =>
          sub.isActive &&
          sub.criteria.keywords.trim().toLowerCase() === criteria.keywords.trim().toLowerCase() &&
          sub.criteria.location.trim().toLowerCase() === criteria.location.trim().toLowerCase() &&
          sub.criteria.minSalary === criteria.minSalary &&
          sub.criteria.maxSalary === criteria.maxSalary
      );
    },
    [subscriptions]
  );

  const scanLiveAtsMatches = useCallback(
    async (subscriptionId?: string, overrideSub?: JobAlertSubscription): Promise<LiveJobNotification | null> => {
      const targetSub =
        overrideSub ||
        (subscriptionId ? subscriptions.find((s) => s.id === subscriptionId) : subscriptions[0]);

      if (!targetSub) return null;

      setIsScanning(true);
      setScanError(null);
      try {
        const res = await fetch('/api/jobs/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keywords: targetSub.criteria.keywords,
            location: targetSub.criteria.location === 'All' ? '' : targetSub.criteria.location,
            minSalary: targetSub.criteria.minSalary,
            maxSalary: targetSub.criteria.maxSalary,
            urgency: targetSub.criteria.urgency || 'All',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || 'Live ATS alert scan failed');
        }

        const matchedJobs: JobAlert[] = Array.isArray(data.jobs) ? data.jobs : [];
        const existingJobIds = new Set(notifications.map((n) => n.job.id));
        const pickedJob = matchedJobs.find((j) => !existingJobIds.has(j.id)) || matchedJobs[0];

        if (!pickedJob) {
          setScanError(`No open ATS roles currently match "${targetSub.title}".`);
          return null;
        }

        const notifId = `notif-${Date.now().toString(36)}`;
        const newNotif: LiveJobNotification = {
          id: notifId,
          alertId: targetSub.id,
          alertTitle: targetSub.title,
          job: pickedJob,
          headline: `LIVE ATS MATCH // ${pickedJob.title} at ${pickedJob.company} (${pickedJob.salaryRange})`,
          timestamp: 'Just now',
          isRead: false,
        };

        if (user?.uid) {
          const notifDocRef = doc(db, 'users', user.uid, 'alertNotifications', notifId);
          await setDoc(notifDocRef, {
            id: notifId,
            userId: user.uid,
            subscriptionId: targetSub.id,
            jobId: String(pickedJob.id).slice(0, 150),
            jobTitle: String(pickedJob.title).slice(0, 190),
            company: String(pickedJob.company).slice(0, 150),
            location: String(pickedJob.location || '').slice(0, 150),
            salaryLabel: String(pickedJob.salaryRange || '').slice(0, 110),
            urgency: String(pickedJob.urgency || 'HIGH PRIORITY').slice(0, 50),
            applyUrl: String(pickedJob.applyUrl || '').slice(0, 480),
            matchedCriteriaLabel: String(targetSub.title).slice(0, 170),
            isRead: false,
            createdAt: serverTimestamp(),
          }).catch((err) => {
            if (isFirestorePermissionError(err)) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/alertNotifications/${notifId}`);
            }
          });

          const subDocRef = doc(db, 'users', user.uid, 'jobAlerts', targetSub.id);
          await updateDoc(subDocRef, {
            matchCount: (targetSub.matchCount || 0) + 1,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        } else {
          setNotifications((prev) => [newNotif, ...prev]);
          setSubscriptions((prev) =>
            prev.map((s) =>
              s.id === targetSub.id
                ? { ...s, matchCount: s.matchCount + 1, lastTriggeredAt: 'Just now' }
                : s
            )
          );
        }

        return newNotif;
      } catch (err: any) {
        setScanError(err?.message || 'Unable to scan external ATS boards right now.');
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [notifications, subscriptions, user?.uid]
  );

  const subscribeToAlert = useCallback(
    (criteria: JobAlertCriteria, customTitle?: string): JobAlertSubscription => {
      const kwText = criteria.keywords.trim() || 'All Technical Sectors';
      const locText = criteria.location && criteria.location !== 'All' ? ` in ${criteria.location}` : '';
      const salText =
        criteria.minSalary > 0
          ? ` ($${Math.round(criteria.minSalary / 1000)}k - $${Math.round(criteria.maxSalary / 1000)}k+)`
          : '';
      const generatedTitle = (customTitle || `${kwText}${locText}${salText}`).slice(0, 150);

      const existing = subscriptions.find(
        (s) =>
          s.criteria.keywords.trim().toLowerCase() === criteria.keywords.trim().toLowerCase() &&
          s.criteria.location.trim().toLowerCase() === criteria.location.trim().toLowerCase() &&
          s.criteria.minSalary === criteria.minSalary &&
          s.criteria.maxSalary === criteria.maxSalary
      );

      if (existing) {
        const reactivated = { ...existing, isActive: true };
        if (user?.uid) {
          updateDoc(doc(db, 'users', user.uid, 'jobAlerts', existing.id), {
            active: true,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        } else {
          setSubscriptions((prev) => prev.map((s) => (s.id === existing.id ? reactivated : s)));
        }
        void scanLiveAtsMatches(existing.id, reactivated);
        return reactivated;
      }

      const subId = `sub-${Date.now().toString(36)}`;
      const newSub: JobAlertSubscription = {
        id: subId,
        title: generatedTitle,
        criteria: {
          keywords: criteria.keywords.trim().slice(0, 150),
          location: (criteria.location || 'All').slice(0, 90),
          minSalary: Math.max(0, Number(criteria.minSalary) || 0),
          maxSalary: Math.max(Number(criteria.minSalary) || 0, Number(criteria.maxSalary) || 600000),
          urgency: (criteria.urgency || 'All').slice(0, 35),
        },
        frequency: 'Real-time',
        createdAt: 'Just now',
        matchCount: 0,
        isActive: true,
      };

      if (user?.uid) {
        setDoc(doc(db, 'users', user.uid, 'jobAlerts', subId), {
          id: subId,
          userId: user.uid,
          title: newSub.title,
          keywords: newSub.criteria.keywords,
          location: newSub.criteria.location,
          minSalary: newSub.criteria.minSalary,
          maxSalary: newSub.criteria.maxSalary,
          urgency: newSub.criteria.urgency || 'All',
          active: true,
          matchCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
          .then(() => scanLiveAtsMatches(subId, newSub))
          .catch((err) => {
            if (isFirestorePermissionError(err)) {
              handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/jobAlerts/${subId}`);
            }
          });
      } else {
        setSubscriptions((prev) => [newSub, ...prev]);
        void scanLiveAtsMatches(subId, newSub);
      }

      return newSub;
    },
    [scanLiveAtsMatches, subscriptions, user?.uid]
  );

  const unsubscribeFromAlert = useCallback(
    (id: string) => {
      if (user?.uid) {
        deleteDoc(doc(db, 'users', user.uid, 'jobAlerts', id)).catch((err) => {
          if (isFirestorePermissionError(err)) {
            handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/jobAlerts/${id}`);
          }
        });
      } else {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [user?.uid]
  );

  const toggleSubscriptionActive = useCallback(
    (id: string) => {
      const target = subscriptions.find((s) => s.id === id);
      if (!target) return;
      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid, 'jobAlerts', id), {
          active: !target.isActive,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      } else {
        setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)));
      }
    },
    [subscriptions, user?.uid]
  );

  const markNotificationAsRead = useCallback(
    (id: string) => {
      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid, 'alertNotifications', id), { isRead: true }).catch(() => {});
      } else {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      }
    },
    [user?.uid]
  );

  const markAllNotificationsAsRead = useCallback(() => {
    if (user?.uid) {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.isRead)
        .forEach((n) => {
          batch.update(doc(db, 'users', user.uid, 'alertNotifications', n.id), { isRead: true });
        });
      batch.commit().catch(() => {});
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }, [notifications, user?.uid]);

  const dismissNotification = useCallback(
    (id: string) => {
      if (user?.uid) {
        deleteDoc(doc(db, 'users', user.uid, 'alertNotifications', id)).catch(() => {});
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    },
    [user?.uid]
  );

  const clearAllNotifications = useCallback(() => {
    if (user?.uid) {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, 'users', user.uid, 'alertNotifications', n.id));
      });
      batch.commit().catch(() => {});
    } else {
      setNotifications([]);
    }
  }, [notifications, user?.uid]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <JobAlertsContext.Provider
      value={{
        subscriptions,
        notifications,
        unreadCount,
        isCloudSynced: Boolean(user?.uid),
        isScanning,
        scanError,
        subscribeToAlert,
        unsubscribeFromAlert,
        toggleSubscriptionActive,
        isSubscribedToCriteria,
        scanLiveAtsMatches,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        dismissNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </JobAlertsContext.Provider>
  );
}

export function useJobAlerts() {
  const context = useContext(JobAlertsContext);
  if (!context) {
    throw new Error('useJobAlerts must be used within a JobAlertsProvider');
  }
  return context;
}
