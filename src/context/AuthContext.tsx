import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  googleProvider,
  GoogleAuthProvider,
  setGoogleDriveAccessToken,
  clearGoogleDriveAccessToken,
  handleFirestoreError,
  OperationType,
} from '../firebase';

export interface UserProfileData {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'user' | 'admin';
  securityClearance: 'Recruit' | 'Operator' | 'Command Tier';
  subscriptionStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferencesData {
  userId: string;
  currency: string;
  isPppMode: boolean;
  targetSector: string;
  targetSalary: number;
  targetRole: string;
  notificationAlerts: boolean;
  updatedAt: string;
}

export interface SavedCareerPathItem {
  id: string;
  userId: string;
  roleKey: string;
  roleTitle: string;
  targetSalary: number;
  notes?: string;
  savedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  preferences: UserPreferencesData | null;
  savedCareerPaths: SavedCareerPathItem[];
  driveAccessToken: string | null;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<boolean>;
  connectGoogleDrive: () => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferencesData>) => Promise<void>;
  saveCareerPath: (roleKey: string, roleTitle: string, targetSalary: number, notes?: string) => Promise<void>;
  removeCareerPath: (id: string) => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferencesData = {
  userId: '',
  currency: 'USD',
  isPppMode: false,
  targetSector: 'Frontier AI & High-Performance Compute',
  targetSalary: 310000,
  targetRole: 'Principal AI Infrastructure Architect',
  notificationAlerts: true,
  updatedAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(() => {
    try {
      const stored = localStorage.getItem('talent_radar_user_preferences');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return null;
  });
  const [savedCareerPaths, setSavedCareerPaths] = useState<SavedCareerPathItem[]>(() => {
    try {
      const stored = localStorage.getItem('talent_radar_saved_career_paths');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const isFirestoreOfflineError = (err: unknown): boolean => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);
    return (
      code === 'unavailable' ||
      msg.includes('the client is offline') ||
      msg.includes('Failed to get document') ||
      msg.includes('network-request-failed')
    );
  };

  const isFirestorePermissionError = (err: unknown): boolean => {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);
    return code === 'permission-denied' || msg.includes('Missing or insufficient permissions');
  };

  const buildFallbackProfile = (currentUser: User): UserProfileData => {
    const baseProfile: UserProfileData = {
      id: currentUser.uid,
      email: currentUser.email || 'operator@talentradar.io',
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Radar Operator',
      role: 'user',
      securityClearance: 'Operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (currentUser.photoURL) {
      baseProfile.photoURL = currentUser.photoURL;
    }
    return baseProfile;
  };

  // Sync state with Firestore on auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);

      if (currentUser) {
        const profileCacheKey = `talent_radar_user_profile_${currentUser.uid}`;
        let cachedProfile: UserProfileData | null = null;
        try {
          const rawCached = localStorage.getItem(profileCacheKey);
          if (rawCached) cachedProfile = JSON.parse(rawCached);
        } catch {
          cachedProfile = null;
        }

        // Hydrate immediately from cache if available
        if (cachedProfile) {
          setProfile(cachedProfile);
        }

        try {
          // Fetch or initialize user profile
          const userDocRef = doc(db, 'users', currentUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const data = userDocSnap.data() as UserProfileData;
              setProfile(data);
              try {
                localStorage.setItem(profileCacheKey, JSON.stringify(data));
              } catch {}
            } else {
              const newProfile = buildFallbackProfile(currentUser);
              setProfile(newProfile);
              try {
                localStorage.setItem(profileCacheKey, JSON.stringify(newProfile));
              } catch {}

              if (currentUser.email) {
                try {
                  await setDoc(userDocRef, newProfile);
                } catch (writeErr) {
                  if (isFirestorePermissionError(writeErr)) {
                    handleFirestoreError(writeErr, OperationType.CREATE, `users/${currentUser.uid}`);
                  } else {
                    console.warn('Could not write new profile to Firestore:', writeErr);
                  }
                }
              }
            }
          } catch (profileErr) {
            if (isFirestorePermissionError(profileErr)) {
              handleFirestoreError(profileErr, OperationType.GET, `users/${currentUser.uid}`);
            } else if (isFirestoreOfflineError(profileErr)) {
              console.warn('Firestore offline during profile fetch; using local profile fallback.');
              const fallback = cachedProfile || buildFallbackProfile(currentUser);
              setProfile(fallback);
              try {
                localStorage.setItem(profileCacheKey, JSON.stringify(fallback));
              } catch {}
            } else {
              console.warn('Unexpected error fetching user profile, using fallback:', profileErr);
              setProfile(cachedProfile || buildFallbackProfile(currentUser));
            }
          }

          // Fetch preferences
          const prefDocRef = doc(db, 'users', currentUser.uid, 'preferences', 'settings');
          try {
            const prefSnap = await getDoc(prefDocRef);
            if (prefSnap.exists()) {
              const prefData = prefSnap.data() as UserPreferencesData;
              setPreferences(prefData);
              localStorage.setItem('talent_radar_user_preferences', JSON.stringify(prefData));
            } else {
              const initialPref = {
                ...DEFAULT_PREFERENCES,
                userId: currentUser.uid,
                updatedAt: new Date().toISOString(),
              };
              setPreferences(initialPref);
              localStorage.setItem('talent_radar_user_preferences', JSON.stringify(initialPref));
              await setDoc(prefDocRef, initialPref);
            }
          } catch (e) {
            if (isFirestorePermissionError(e)) {
              handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}/preferences/settings`);
            } else {
              console.warn('Preferences fetch error, falling back to local:', e);
            }
          }

          // Fetch saved career paths
          try {
            const pathsRef = collection(db, 'users', currentUser.uid, 'careerPaths');
            const pathsSnap = await getDocs(pathsRef);
            const items: SavedCareerPathItem[] = [];
            pathsSnap.forEach((docSnap) => {
              items.push(docSnap.data() as SavedCareerPathItem);
            });
            setSavedCareerPaths(items);
            localStorage.setItem('talent_radar_saved_career_paths', JSON.stringify(items));
          } catch (e) {
            if (isFirestorePermissionError(e)) {
              handleFirestoreError(e, OperationType.LIST, `users/${currentUser.uid}/careerPaths`);
            } else {
              console.warn('Career paths fetch error, using local cache:', e);
            }
          }
        } catch (err) {
          console.warn('User Firestore sync degraded to local cache:', err);
          if (!cachedProfile) {
            setProfile(buildFallbackProfile(currentUser));
          }
        }
      } else {
        setProfile(null);
        clearGoogleDriveAccessToken();
        setDriveAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken && driveAccessToken) {
        setGoogleDriveAccessToken(credential.accessToken);
        setDriveAccessToken(credential.accessToken);
      }
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in popup was closed before completing authentication.');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not yet allowlisted in Firebase Authentication Authorized Domains.');
      } else {
        console.warn('Google Sign-In failed:', code || error?.message);
        setAuthError(error?.message || 'Failed to authenticate with Google.');
      }
      return false;
    }
  };

  const connectGoogleDrive = async (): Promise<string | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (!token) {
        throw new Error('Google Drive access token was not granted. Please approve Drive permissions when signing in.');
      }
      setGoogleDriveAccessToken(token);
      setDriveAccessToken(token);
      return token;
    } catch (error: any) {
      console.warn('Google Drive OAuth failed:', error?.code || error?.message);
      setAuthError(error?.message || 'Failed to authorize Google Drive access.');
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !pass) {
      setAuthError('Enter both your email address and password.');
      return false;
    }
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setAuthError(
          'Invalid email or password. If you have not registered with Email/Password yet (or previously used Google SSO), switch to SIGN UP or use Continue with Google SSO below.'
        );
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (code === 'auth/user-disabled') {
        setAuthError('This account has been disabled. Contact support for assistance.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed attempts. Please wait a moment or click Forgot password.');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).'
        );
      } else {
        console.warn('Email Sign-In failed:', code || error?.message);
        setAuthError(error?.message || 'Authentication failed.');
      }
      return false;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim();
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (cred.user) {
        const cleanName = name.trim() || cleanEmail.split('@')[0] || 'Radar Operator';
        await updateProfile(cred.user, { displayName: cleanName });
        const now = new Date().toISOString();
        const newProfile: UserProfileData = {
          id: cred.user.uid,
          email: cred.user.email || cleanEmail,
          displayName: cleanName,
          role: 'user',
          securityClearance: 'Operator',
          createdAt: now,
          updatedAt: now,
        };
        try {
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
          localStorage.setItem(`talent_radar_user_profile_${cred.user.uid}`, JSON.stringify(newProfile));
        } catch (writeErr) {
          if (isFirestorePermissionError(writeErr)) {
            handleFirestoreError(writeErr, OperationType.CREATE, `users/${cred.user.uid}`);
          }
        }
        setProfile(newProfile);
      }
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/email-already-in-use') {
        setAuthError(
          'An account with this email already exists. Switch to LOG IN (or use Forgot password / Continue with Google SSO).'
        );
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Email/Password sign-up is not yet enabled in Firebase Console (Authentication → Sign-in method → Email/Password).'
        );
      } else {
        console.warn('Email Sign-Up failed:', code || error?.message);
        setAuthError(error?.message || 'Account registration failed.');
      }
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/user-not-found') {
        setAuthError('No account found with that email address.');
      } else if (code === 'auth/invalid-email') {
        setAuthError('Please enter a valid email address to reset your password.');
      } else {
        console.warn('Password Reset failed:', code || error?.message);
        setAuthError(error?.message || 'Unable to send password reset email.');
      }
      return false;
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      clearGoogleDriveAccessToken();
      setDriveAccessToken(null);
      setProfile(null);
      setPreferences(null);
      setSavedCareerPaths([]);
      localStorage.removeItem('talent_radar_user_preferences');
      localStorage.removeItem('talent_radar_saved_career_paths');
    } catch (error: any) {
      console.error('Sign-Out Error:', error);
      setAuthError(error.message || 'Sign out failed.');
    }
  };

  const updateUserPreferences = async (prefs: Partial<UserPreferencesData>) => {
    const updated = {
      ...(preferences || DEFAULT_PREFERENCES),
      ...prefs,
      userId: user?.uid || '',
      updatedAt: new Date().toISOString(),
    };
    setPreferences(updated);
    localStorage.setItem('talent_radar_user_preferences', JSON.stringify(updated));

    if (user) {
      try {
        const prefDocRef = doc(db, 'users', user.uid, 'preferences', 'settings');
        await setDoc(prefDocRef, updated, { merge: true });
      } catch (err) {
        console.warn('Failed to persist preferences to Firestore:', err);
      }
    }
  };

  const saveCareerPath = async (roleKey: string, roleTitle: string, targetSalary: number, notes?: string) => {
    const newPath: SavedCareerPathItem = {
      id: `cp-${Date.now()}`,
      userId: user?.uid || 'guest',
      roleKey,
      roleTitle,
      targetSalary,
      notes: notes || 'Strategic compensation trajectory model.',
      savedAt: new Date().toISOString(),
    };

    const nextPaths = [newPath, ...savedCareerPaths.filter((p) => p.roleKey !== roleKey)];
    setSavedCareerPaths(nextPaths);
    localStorage.setItem('talent_radar_saved_career_paths', JSON.stringify(nextPaths));

    if (user) {
      try {
        const pathDocRef = doc(db, 'users', user.uid, 'careerPaths', newPath.id);
        await setDoc(pathDocRef, newPath);
      } catch (err) {
        console.warn('Failed to persist career path to Firestore:', err);
      }
    }
  };

  const removeCareerPath = async (id: string) => {
    const nextPaths = savedCareerPaths.filter((p) => p.id !== id);
    setSavedCareerPaths(nextPaths);
    localStorage.setItem('talent_radar_saved_career_paths', JSON.stringify(nextPaths));

    if (user) {
      try {
        const pathDocRef = doc(db, 'users', user.uid, 'careerPaths', id);
        await deleteDoc(pathDocRef);
      } catch (err) {
        console.warn('Failed to delete career path from Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        preferences,
        savedCareerPaths,
        driveAccessToken,
        loading,
        authError,
        clearAuthError,
        signInWithGoogle,
        connectGoogleDrive,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOutUser,
        updateUserPreferences,
        saveCareerPath,
        removeCareerPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
