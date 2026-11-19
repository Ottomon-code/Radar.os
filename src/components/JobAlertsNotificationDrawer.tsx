import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  X,
  Sparkles,
  Trash2,
  ExternalLink,
  MapPin,
  DollarSign,
  RefreshCw,
  Eye,
  Clock,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { useJobAlerts } from '../context/JobAlertsContext';
import { JobAlert } from '../utils/radarEngine';

interface JobAlertsNotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJob?: (job: JobAlert) => void;
  onApplyCriteria?: (criteria: { keywords: string; location: string; minSalary: number; maxSalary: number }) => void;
}

export default function JobAlertsNotificationDrawer({
  isOpen,
  onClose,
  onSelectJob,
  onApplyCriteria,
}: JobAlertsNotificationDrawerProps) {
  const {
    subscriptions,
    notifications,
    unreadCount,
    isCloudSynced,
    isScanning,
    scanError,
    unsubscribeFromAlert,
    toggleSubscriptionActive,
    scanLiveAtsMatches,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    clearAllNotifications,
  } = useJobAlerts();

  const [activeTab, setActiveTab] = useState<'notifications' | 'subscriptions'>('notifications');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLiveScan = async (subId?: string) => {
    const match = await scanLiveAtsMatches(subId);
    if (match) {
      setSuccessToast(`Live ATS match found: ${match.job.title} at ${match.job.company}`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerts-drawer-title"
    >
      <div className="bg-[#111a22] border border-[#1e2b36] rounded-2xl max-w-2xl w-full p-5 sm:p-6 text-[#dce7f0] shadow-2xl relative max-h-[90vh] flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5]/30 text-[#22d3a5]">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 id="alerts-drawer-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                LIVE ATS JOB ALERTS &amp; NOTIFICATIONS
              </h2>
              <p className="text-xs text-[#7a8b99]">
                Monitors Ashby, Greenhouse, and Lever boards against your logged criteria
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] hover:text-white transition"
            aria-label="Close alerts panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast */}
        {successToast && (
          <div className="mb-3 p-2.5 rounded-lg bg-[#22d3a5]/15 border border-[#22d3a5] text-[#22d3a5] text-xs flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4" /> {successToast}
            </span>
            <button onClick={() => setSuccessToast(null)} className="text-xs text-[#7a8b99] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {scanError && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Tab Switcher & Live Scan Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 bg-[#0a0f14] p-1.5 rounded-xl border border-[#1e2b36]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'notifications'
                  ? 'bg-[#22d3a5] text-black shadow'
                  : 'text-[#7a8b99] hover:text-white'
              }`}
            >
              <span>Incoming Matches</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-[#111a22] text-[#7a8b99]'
                }`}
              >
                {unreadCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'subscriptions'
                  ? 'bg-[#22d3a5] text-black shadow'
                  : 'text-[#7a8b99] hover:text-white'
              }`}
            >
              <span>Subscribed Criteria</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#111a22] text-[#7a8b99] font-bold">
                {subscriptions.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => handleLiveScan()}
            disabled={isScanning || subscriptions.length === 0}
            className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/50 text-[#3b82f6] text-xs font-semibold flex items-center justify-center gap-1.5 transition self-start sm:self-auto disabled:opacity-40 cursor-pointer"
            title="Scan live public ATS boards against subscribed criteria"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Live ATS...' : 'Scan Live ATS Now'}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {activeTab === 'notifications' ? (
            notifications.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-[#1e2b36] rounded-xl text-[#7a8b99] space-y-3">
                <Bell className="w-8 h-8 mx-auto text-[#7a8b99]/40" />
                <p className="text-xs">
                  {subscriptions.length === 0
                    ? 'No live alert subscriptions yet. Use "Subscribe to Alerts" on the Job Radar to start monitoring.'
                    : 'No live ATS matches logged yet for your active subscriptions.'}
                </p>
                {subscriptions.length > 0 && (
                  <button
                    onClick={() => handleLiveScan()}
                    disabled={isScanning}
                    className="px-3 py-1.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 text-xs hover:bg-[#22d3a5]/30 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Scan Live ATS Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#7a8b99] pb-1">
                  <span>SHOWING {notifications.length} LIVE ATS ALERTS</span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[#22d3a5] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={clearAllNotifications}
                      className="text-[#f87171] hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border transition ${
                      n.isRead
                        ? 'bg-[#0a0f14] border-[#1e2b36]'
                        : 'bg-[#131f2b] border-[#22d3a5]/50 shadow-[0_0_15px_rgba(34,211,165,0.15)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#22d3a5]" />
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/30">
                            LIVE ATS MATCH
                          </span>
                          <span className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {n.timestamp}
                          </span>
                          <span className="text-[10px] text-[#38bdf8] font-semibold">
                            {n.job.matchScore}% Match
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white">{n.job.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a8b99]">
                          <span className="text-[#dce7f0] font-semibold">{n.job.company}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#3b82f6]" /> {n.job.location}
                          </span>
                          <span className="text-[#22d3a5] font-semibold flex items-center gap-0.5">
                            <DollarSign className="w-3 h-3" /> {n.job.salaryRange}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#7a8b99] pt-1">
                          Matched via alert: <span className="text-[#dce7f0]">{n.alertTitle}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="text-[#7a8b99] hover:text-[#f87171] p-1 transition"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {n.job.applyUrl && (
                          <a
                            href={n.job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markNotificationAsRead(n.id)}
                            className="px-2.5 py-1 rounded bg-[#22d3a5] hover:bg-[#1db890] text-black text-xs font-bold transition flex items-center gap-1 shadow"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open ATS</span>
                          </a>
                        )}

                        {onSelectJob && (
                          <button
                            onClick={() => {
                              markNotificationAsRead(n.id);
                              onSelectJob(n.job);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#dce7f0] text-xs font-semibold transition flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#7a8b99]">
                <span>LOGGED SEARCH CRITERIA ({subscriptions.length})</span>
                <span className="flex items-center gap-1 text-[#22d3a5]">
                  <Cloud className="w-3 h-3" />
                  {isCloudSynced ? 'CLOUD SYNCED' : 'LOCAL SESSION'}
                </span>
              </div>

              {subscriptions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#1e2b36] rounded-xl text-[#7a8b99] text-xs space-y-2">
                  <p>No search criteria logged yet.</p>
                  <p className="text-[11px]">
                    Use the Subscribe to Alerts button in the Job Search tab to monitor live external ATS roles.
                  </p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36]/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            sub.isActive ? 'bg-[#22d3a5] animate-pulse' : 'bg-[#7a8b99]'
                          }`}
                        />
                        <h4 className="text-xs sm:text-sm font-bold text-white">{sub.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#7a8b99]">
                          {sub.frequency}
                        </span>
                        <button
                          onClick={() => toggleSubscriptionActive(sub.id)}
                          className={`text-[10px] px-2 py-0.5 rounded border transition font-semibold ${
                            sub.isActive
                              ? 'bg-[#22d3a5]/20 text-[#22d3a5] border-[#22d3a5]/40'
                              : 'bg-[#7a8b99]/20 text-[#7a8b99] border-[#7a8b99]/40'
                          }`}
                        >
                          {sub.isActive ? 'Active' : 'Paused'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="bg-[#111a22] p-2 rounded border border-[#1e2b36]">
                        <span className="text-[10px] text-[#7a8b99] block">KEYWORDS:</span>
                        <span className="text-[#22d3a5] truncate block">
                          {sub.criteria.keywords || 'Any Tech Stack'}
                        </span>
                      </div>

                      <div className="bg-[#111a22] p-2 rounded border border-[#1e2b36]">
                        <span className="text-[10px] text-[#7a8b99] block">LOCATION:</span>
                        <span className="text-[#3b82f6] truncate block">
                          {sub.criteria.location || 'All Hubs'}
                        </span>
                      </div>

                      <div className="bg-[#111a22] p-2 rounded border border-[#1e2b36]">
                        <span className="text-[10px] text-[#7a8b99] block">COMP BAND:</span>
                        <span className="text-[#fbbf24] truncate block">
                          ${sub.criteria.minSalary.toLocaleString()} - {sub.criteria.maxSalary >= 600000 ? '$600k+' : '$' + sub.criteria.maxSalary.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e2b36]/40 text-xs">
                      <div className="text-[10px] text-[#7a8b99]">
                        Created: {sub.createdAt} • Live Matches Logged: {sub.matchCount}
                      </div>

                      <div className="flex items-center gap-2">
                        {onApplyCriteria && (
                          <button
                            onClick={() => {
                              onApplyCriteria({
                                keywords: sub.criteria.keywords,
                                location: sub.criteria.location,
                                minSalary: sub.criteria.minSalary,
                                maxSalary: sub.criteria.maxSalary,
                              });
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5] text-[#22d3a5] text-[11px] transition flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Apply to Radar
                          </button>
                        )}

                        <button
                          onClick={() => handleLiveScan(sub.id)}
                          disabled={isScanning}
                          className="px-2.5 py-1 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#3b82f6] border border-[#3b82f6]/40 text-[11px] transition flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" /> Scan Live ATS
                        </button>

                        <button
                          onClick={() => unsubscribeFromAlert(sub.id)}
                          className="p-1 text-[#7a8b99] hover:text-[#f87171] transition"
                          title="Delete subscription"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
