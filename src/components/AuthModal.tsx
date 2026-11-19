import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  LogOut,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'profile';
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
}: AuthModalProps) {
  const {
    user,
    preferences,
    savedCareerPaths,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOutUser,
    authError,
    clearAuthError,
    driveAccessToken,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(() =>
    defaultMode === 'signup' ? 'signup' : 'login'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const switchMode = (nextMode: 'login' | 'signup') => {
    setMode(nextMode);
    clearAuthError();
    setLocalError(null);
    setLocalMessage(null);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setLocalError(null);
    setLocalMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok =
        mode === 'signup'
          ? await signUpWithEmail(cleanEmail, password, fullName.trim() || cleanEmail.split('@')[0])
          : await signInWithEmail(cleanEmail, password);
      if (ok) {
        setLocalMessage(
          mode === 'signup'
            ? 'Account created! Signing you into the dashboard...'
            : 'Authenticated! Opening dashboard...'
        );
        setTimeout(() => onClose(), 700);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    clearAuthError();
    setLocalError(null);
    setLocalMessage(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalError('Enter your email address above first, then click Forgot Password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const ok = await resetPassword(cleanEmail);
      if (ok) {
        setLocalMessage(`Password reset link sent to ${cleanEmail}. Check your inbox.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    clearAuthError();
    setLocalError(null);
    setLocalMessage(null);
    setIsSubmitting(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedError = localError || authError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-mono">
      <div className="relative w-full max-w-md bg-[#0f171e] border border-[#1e2b36] rounded-xl shadow-2xl overflow-hidden text-[#dce7f0] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b36] bg-[#111a22]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dce7f0]">
                {user
                  ? 'AUTHENTICATED OPERATOR PROFILE'
                  : mode === 'signup'
                  ? 'CREATE OPERATOR ACCOUNT'
                  : 'SECURE OPERATOR LOGIN'}
              </h3>
              <p className="text-[11px] text-[#7a8b99]">
                {user
                  ? 'Cloud-Synchronized User Telemetry'
                  : 'Access Saved Career Trajectories & Preferences'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#1e2b36] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {user ? (
            /* User Profile View */
            <div className="space-y-4 font-sans text-xs">
              <div className="p-4 bg-[#111a22] border border-[#22d3a5]/30 rounded-xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#22d3a5] to-[#38bdf8] flex items-center justify-center text-black font-bold text-lg shrink-0 overflow-hidden shadow">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user.displayName || user.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#dce7f0] truncate">
                      {user.displayName || 'Radar Operator'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-mono font-bold border border-[#22d3a5]/40">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-[11px] text-[#7a8b99] font-mono truncate">{user.email}</div>
                  <div className="text-[10px] text-gray-500 font-mono mt-0.5">UID: {user.uid.substring(0, 14)}...</div>
                </div>
              </div>

              {/* Account Stats & Saved Preferences */}
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg">
                  <div className="text-[10px] text-[#7a8b99] uppercase">Saved Career Paths</div>
                  <div className="text-base font-bold text-[#22d3a5] mt-0.5">
                    {savedCareerPaths.length}
                  </div>
                </div>
                <div className="p-3 bg-[#0a0f14] border border-[#1e2b36] rounded-lg">
                  <div className="text-[10px] text-[#7a8b99] uppercase">Active Currency</div>
                  <div className="text-base font-bold text-[#fbbf24] mt-0.5">
                    {preferences?.currency || 'USD'} {preferences?.isPppMode ? '(PPP)' : ''}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg space-y-1 text-[11px] font-mono text-[#7a8b99]">
                <div className="flex justify-between items-center text-[#dce7f0]">
                  <span>Target Role:</span>
                  <span className="text-[#38bdf8] font-bold">{preferences?.targetRole || 'AI Infrastructure Lead'}</span>
                </div>
                <div className="flex justify-between items-center text-[#dce7f0]">
                  <span>Target Compensation:</span>
                  <span className="text-[#22d3a5] font-bold">${preferences?.targetSalary?.toLocaleString() || '310,000'} / yr</span>
                </div>
                <div className="flex justify-between items-center text-[#dce7f0]">
                  <span>Cloud Persistence:</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Firestore Active</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new CustomEvent('open-drive-modal'));
                }}
                className="w-full py-2.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 border border-[#38bdf8]/50 text-[#38bdf8] text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>
                  {driveAccessToken ? 'OPEN GOOGLE DRIVE VAULT (CONNECTED)' : 'OPEN GOOGLE DRIVE VAULT'}
                </span>
              </button>

              <button
                onClick={async () => {
                  await signOutUser();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-[#1e2b36] hover:bg-rose-950/40 hover:text-rose-400 border border-[#2b3e50] hover:border-rose-500/40 text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN OUT ACCOUNT</span>
              </button>
            </div>
          ) : (
            /* Traditional Email & Password + Google SSO View */
            <div className="space-y-4">
              {/* Log In / Sign Up Mode Switcher */}
              <div className="grid grid-cols-2 p-1 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`py-2 rounded-md font-bold transition cursor-pointer ${
                    mode === 'login' ? 'bg-[#22d3a5] text-black shadow' : 'text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  LOG IN
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`py-2 rounded-md font-bold transition cursor-pointer ${
                    mode === 'signup' ? 'bg-[#22d3a5] text-black shadow' : 'text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  SIGN UP
                </button>
              </div>

              <form onSubmit={handleEmailAuthSubmit} className="space-y-3 text-xs">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] uppercase text-[#7a8b99] mb-1">Full Name</label>
                    <div className="flex items-center gap-2 bg-[#0a0f14] border border-[#1e2b36] focus-within:border-[#22d3a5]/60 rounded-lg px-3 py-2 text-[#dce7f0]">
                      <UserIcon className="w-3.5 h-3.5 text-[#7a8b99] shrink-0" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="bg-transparent outline-none w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-[#7a8b99] mb-1">Email Address</label>
                  <div className="flex items-center gap-2 bg-[#0a0f14] border border-[#1e2b36] focus-within:border-[#22d3a5]/60 rounded-lg px-3 py-2 text-[#dce7f0]">
                    <Mail className="w-3.5 h-3.5 text-[#7a8b99] shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      required
                      className="bg-transparent outline-none w-full text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] uppercase text-[#7a8b99]">
                      {mode === 'signup' ? 'Create Password (min 6 chars)' : 'Password'}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                        className="text-[10px] text-[#38bdf8] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-[#0a0f14] border border-[#1e2b36] focus-within:border-[#22d3a5]/60 rounded-lg px-3 py-2 text-[#dce7f0]">
                    <KeyRound className="w-3.5 h-3.5 text-[#7a8b99] shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="bg-transparent outline-none w-full text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-[#7a8b99] hover:text-[#dce7f0] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="block text-[10px] uppercase text-[#7a8b99] mb-1">Confirm Password</label>
                    <div className="flex items-center gap-2 bg-[#0a0f14] border border-[#1e2b36] focus-within:border-[#22d3a5]/60 rounded-lg px-3 py-2 text-[#dce7f0]">
                      <KeyRound className="w-3.5 h-3.5 text-[#7a8b99] shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="bg-transparent outline-none w-full text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {(displayedError || localMessage) && (
                  <div
                    className={`p-3 rounded-lg border text-[11px] font-mono space-y-2 ${
                      displayedError
                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                        : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{displayedError || localMessage}</span>
                    </div>
                    {mode === 'login' &&
                      displayedError &&
                      displayedError.includes('SIGN UP') && (
                        <button
                          type="button"
                          onClick={() => switchMode('signup')}
                          className="text-[10px] font-bold text-[#22d3a5] hover:underline cursor-pointer"
                        >
                          Need an account? Switch to SIGN UP →
                        </button>
                      )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold font-mono text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 shadow-[0_0_14px_rgba(34,211,165,0.25)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{mode === 'signup' ? 'CREATING ACCOUNT...' : 'SIGNING IN...'}</span>
                    </>
                  ) : (
                    <span>{mode === 'signup' ? 'CREATE ACCOUNT WITH EMAIL' : 'LOG IN WITH EMAIL'}</span>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3 text-[10px] text-[#7a8b99] uppercase font-mono">
                <div className="flex-1 h-px bg-[#1e2b36]" />
                <span>Or continue with</span>
                <div className="flex-1 h-px bg-[#1e2b36]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-lg bg-[#111a22] hover:bg-[#182430] border border-[#2b3e50] text-[#dce7f0] font-sans font-semibold text-xs flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google SSO</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-[#1e2b36] bg-[#0c131a] flex items-center justify-between text-[10px] text-[#7a8b99] font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span>End-to-End Firebase Auth &amp; Firestore Security</span>
          </div>
          <span>Cloud Identity</span>
        </div>
      </div>
    </div>
  );
}
