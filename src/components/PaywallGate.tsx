import React from 'react';
import { Lock, ShieldCheck, Zap } from 'lucide-react';
import { useSubscription, SubscriptionTier } from '../context/SubscriptionContext';

interface PaywallGateProps {
  children: React.ReactNode;
  requiredTier?: SubscriptionTier;
  featureTitle?: string;
  featureDescription?: string;
  blurLevel?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PaywallGate({
  children,
  requiredTier = 'pro',
  featureTitle = 'PRO OPERATOR CLEARANCE REQUIRED',
  featureDescription = 'This intelligence stream is restricted to verified Pro Operators and Sovereign Partners.',
  blurLevel = 'md',
  className = '',
}: PaywallGateProps) {
  const { tier, isPro, isSovereign, openPaywall } = useSubscription();

  const isUnlocked =
    requiredTier === 'sovereign' ? isSovereign : requiredTier === 'pro' ? isPro : true;

  if (isUnlocked) {
    return <>{children}</>;
  }

  const blurClasses = {
    sm: 'blur-xs select-none pointer-events-none opacity-40',
    md: 'blur-sm select-none pointer-events-none opacity-30',
    lg: 'blur-md select-none pointer-events-none opacity-20',
  }[blurLevel];

  return (
    <div className={`relative overflow-hidden rounded-xl group ${className}`}>
      {/* Blurred Child Content */}
      <div className={blurClasses} aria-hidden="true">
        {children}
      </div>

      {/* Paywall Overlay Barrier */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0a0f14]/80 via-[#0c141c]/95 to-[#0a0f14]/90 backdrop-blur-[2px] border border-[#22d3a5]/30 rounded-xl shadow-inner">
        <div className="w-12 h-12 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5] flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(34,211,165,0.25)] group-hover:scale-105 transition-transform">
          <Lock className="w-6 h-6 text-[#22d3a5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f87171]/20 border border-[#f87171]/40 text-[#f87171] text-[10px] font-mono font-bold tracking-wider mb-2">
          RESTRICTED TELEMETRY
        </div>

        <h4 className="text-sm sm:text-base font-bold font-mono text-white mb-1 tracking-tight">
          {featureTitle}
        </h4>

        <p className="text-xs font-mono text-[#7a8b99] max-w-md mb-4 leading-relaxed">
          {featureDescription}
        </p>

        <button
          onClick={() => openPaywall(featureTitle)}
          className="px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold font-mono text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,165,0.3)] transition transform hover:-translate-y-0.5"
        >
          <Zap className="w-4 h-4" />
          UNLOCK WITH OPERATOR PASS
        </button>
      </div>
    </div>
  );
}
