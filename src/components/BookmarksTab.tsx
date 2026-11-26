import React, { useState } from 'react';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Briefcase,
  Compass,
  Newspaper,
  ArrowRight,
  Send,
  MapPin,
  DollarSign,
  TrendingUp,
  Sparkles,
  Shield,
  Layers,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  useSavedItems,
  SavedJobItem,
  SavedCareerPathItem,
  SavedNewsItem,
} from '../context/SavedItemsContext';
import AICareerCoachingPanel from './AICareerCoachingPanel';

interface BookmarksTabProps {
  onNavigateToJobRadar?: (searchKeyword?: string) => void;
  onNavigateToCareer?: (targetRole: string, targetSalary?: number) => void;
  onNavigateToNews?: (company: string, sector: string) => void;
  onNavigateToFinance?: () => void;
}

export default function BookmarksTab({
  onNavigateToJobRadar,
  onNavigateToCareer,
  onNavigateToNews,
  onNavigateToFinance,
}: BookmarksTabProps) {
  const {
    savedJobs,
    savedCareerPaths,
    savedNews,
    totalSavedCount,
    removeJob,
    removeCareerPath,
    removeNewsItem,
    clearAllBookmarks,
  } = useSavedItems();

  const [activeFilter, setActiveFilter] = useState<'all' | 'jobs' | 'career' | 'news'>('all');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleApply = (jobId: string) => {
    if (!appliedJobIds.includes(jobId)) {
      setAppliedJobIds([...appliedJobIds, jobId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Career Coaching Summary Panel */}
      <AICareerCoachingPanel
        onNavigateToCareer={onNavigateToCareer}
        onNavigateToJobs={onNavigateToJobRadar}
        onNavigateToFinance={onNavigateToFinance}
      />

      {/* Header Panel */}
      <div className="panel bg-gradient-to-br from-[#111a22] via-[#0d1620] to-[#152332] border border-[#1e2b36] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-semibold tracking-wider">
                PERSISTENT LOCAL STORAGE VAULT
              </span>
              <span className="text-xs font-mono text-[#7a8b99]">
                SAVED ITEMS
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-[#dce7f0] mt-1 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#22d3a5]" />
              BOOKMARKS &amp; RECON ARCHIVE ({totalSavedCount})
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
              Saved target vacancies, custom career trajectories, and strategic market intelligence briefs.
            </p>
          </div>

          {totalSavedCount > 0 && (
            <div className="self-start sm:self-auto">
              {showClearConfirm ? (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#f87171]">Clear all?</span>
                  <button
                    onClick={() => {
                      clearAllBookmarks();
                      setShowClearConfirm(false);
                    }}
                    className="px-2.5 py-1 bg-[#f87171] hover:bg-[#ef4444] text-white font-bold rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2.5 py-1 bg-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#f87171] text-xs font-mono text-[#7a8b99] hover:text-[#f87171] transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Vault</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeFilter === 'all'
                ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-semibold'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            All Bookmarks ({totalSavedCount})
          </button>

          <button
            onClick={() => setActiveFilter('jobs')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
              activeFilter === 'jobs'
                ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6] font-semibold'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Requisitions ({savedJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('career')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
              activeFilter === 'career'
                ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24] font-semibold'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Career Roadmaps ({savedCareerPaths.length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('news')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
              activeFilter === 'news'
                ? 'bg-purple-500/20 border-purple-500 text-purple-400 font-semibold'
                : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Market Intel ({savedNews.length})</span>
          </button>
        </div>
      </div>

      {/* EMPTY STATE */}
      {totalSavedCount === 0 && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-12 text-center font-mono space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99] flex items-center justify-center mx-auto">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#dce7f0]">YOUR BOOKMARKS VAULT IS EMPTY</h3>
            <p className="text-xs text-[#7a8b99] mt-1 max-w-md mx-auto leading-relaxed">
              Bookmark high-value jobs, projected career path trajectories, and wire intel briefs as you explore the radar.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            {onNavigateToJobRadar && (
              <button
                onClick={() => onNavigateToJobRadar()}
                className="px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Browse Requisitions</span>
              </button>
            )}
            {onNavigateToCareer && (
              <button
                onClick={() => onNavigateToCareer('Principal AI Systems Architect', 300000)}
                className="px-3.5 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Career Paths</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1: SAVED JOBS */}
      {(activeFilter === 'all' || activeFilter === 'jobs') && savedJobs.length > 0 && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-[#7a8b99] px-1">
            <span className="flex items-center gap-1.5 text-[#3b82f6] font-semibold">
              <Briefcase className="w-3.5 h-3.5" />
              BOOKMARKED OPPORTUNITIES ({savedJobs.length})
            </span>
          </div>

          <div className="space-y-3">
            {savedJobs.map((job, idx) => {
              const isApplied = appliedJobIds.includes(job.id);
              return (
                <div
                  key={`${job.id}-${idx}`}
                  className="panel bg-[#111a22] border border-[#1e2b36] hover:border-[#3b82f6]/50 rounded-xl p-4 transition shadow relative group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]">
                          {job.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">
                          {job.sector}
                        </span>
                        <span className="text-[#7a8b99]">Saved: {job.savedAt}</span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#dce7f0]">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#7a8b99] mt-1">
                          <span className="text-[#dce7f0] font-semibold">{job.company}</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#3b82f6]" /> {job.location}
                          </span>
                          <span className="text-[#22d3a5] font-semibold flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> {job.salaryRange}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.skills.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#7a8b99]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex lg:flex-col items-center justify-between lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#1e2b36]">
                      <div className="text-right">
                        <span className="text-[10px] text-[#7a8b99]">MATCH SCORE</span>
                        <div className="text-lg font-bold text-[#22d3a5]">
                          {job.matchScore}%
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onNavigateToCareer && (
                          <button
                            onClick={() => onNavigateToCareer(job.title, job.numericMaxSalary)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#22d3a5] text-xs text-[#22d3a5] flex items-center gap-1"
                          >
                            <Compass className="w-3 h-3" />
                            <span>Roadmap</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={isApplied}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            isApplied
                              ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]'
                              : 'bg-[#22d3a5] hover:bg-[#1db890] text-black'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{isApplied ? 'Applied' : 'Fast Apply'}</span>
                        </button>

                        <button
                          onClick={() => removeJob(job.id)}
                          title="Remove bookmark"
                          className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#f87171] text-[#7a8b99] hover:text-[#f87171] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SAVED CAREER PATHS */}
      {(activeFilter === 'all' || activeFilter === 'career') && savedCareerPaths.length > 0 && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-[#7a8b99] px-1">
            <span className="flex items-center gap-1.5 text-[#fbbf24] font-semibold">
              <Compass className="w-3.5 h-3.5" />
              BOOKMARKED CAREER TRAJECTORIES ({savedCareerPaths.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedCareerPaths.map((cp) => (
              <div
                key={cp.id}
                className="panel bg-[#111a22] border border-[#1e2b36] hover:border-[#fbbf24]/50 rounded-xl p-5 shadow flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-[#7a8b99] pb-2 border-b border-[#1e2b36]">
                    <span className="text-[#fbbf24] font-semibold">TRANSITION TRAJECTORY</span>
                    <span>Saved: {cp.savedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-[#dce7f0] mt-2">
                    {cp.targetRole}
                  </h3>
                  <div className="text-xs text-[#7a8b99] mt-0.5">
                    From: {cp.currentRole}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] my-3">
                    <div className="bg-[#0a0f14] p-2 rounded border border-[#1e2b36]">
                      <span className="text-[#7a8b99] block text-[9px]">TARGET COMP</span>
                      <span className="text-[#22d3a5] font-bold">${cp.targetSalary.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#0a0f14] p-2 rounded border border-[#1e2b36]">
                      <span className="text-[#7a8b99] block text-[9px]">READINESS</span>
                      <span className="text-[#3b82f6] font-bold">{cp.readinessScore}%</span>
                    </div>
                    <div className="bg-[#0a0f14] p-2 rounded border border-[#1e2b36]">
                      <span className="text-[#7a8b99] block text-[9px]">EST. RUNWAY</span>
                      <span className="text-[#fbbf24] font-bold">{cp.timelineMonths} Mos</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#7a8b99] block">CRITICAL DEFICIT TARGETS:</span>
                    <div className="flex flex-wrap gap-1">
                      {cp.criticalSkills.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-[#0a0f14] text-[#22d3a5] border border-[#1e2b36]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1e2b36]">
                  {onNavigateToCareer && (
                    <button
                      onClick={() => onNavigateToCareer(cp.targetRole, cp.targetSalary)}
                      className="px-3 py-1.5 rounded-lg bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 text-[#fbbf24] border border-[#fbbf24]/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Load Roadmap</span>
                    </button>
                  )}

                  <button
                    onClick={() => removeCareerPath(cp.id)}
                    title="Remove bookmark"
                    className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#f87171] text-[#7a8b99] hover:text-[#f87171] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SAVED NEWS & INTEL */}
      {(activeFilter === 'all' || activeFilter === 'news') && savedNews.length > 0 && (
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs text-[#7a8b99] px-1">
            <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <Newspaper className="w-3.5 h-3.5" />
              BOOKMARKED MARKET INTEL BRIEFS ({savedNews.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {savedNews.map((item) => (
              <div
                key={item.id}
                className="panel bg-[#111a22] border border-[#1e2b36] hover:border-purple-500/50 rounded-xl p-4 transition shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.impact === 'Positive'
                          ? 'bg-[#22d3a5]'
                          : item.impact === 'Risk'
                          ? 'bg-[#f87171]'
                          : 'bg-[#fbbf24]'
                      }`}
                    />
                    <span className="text-[#dce7f0] font-bold">{item.company}</span>
                    <span className="text-[#7a8b99]">• {item.sector}</span>
                    <span className="text-[#7a8b99]">• Saved: {item.savedAt}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#dce7f0]">
                    {item.headline}
                  </h4>

                  {item.summary && (
                    <p className="text-xs text-[#7a8b99] line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {onNavigateToNews && (
                    <button
                      onClick={() => onNavigateToNews(item.company, item.sector)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>Inspect Brief</span>
                    </button>
                  )}

                  <button
                    onClick={() => removeNewsItem(item.id)}
                    title="Remove bookmark"
                    className="p-1.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] hover:border-[#f87171] text-[#7a8b99] hover:text-[#f87171] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
