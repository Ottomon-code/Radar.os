import React from 'react';

export function MarketAnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-mono">
      {/* Top Banner Skeleton */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 h-28 flex items-center justify-between">
        <div className="space-y-2.5 w-2/3">
          <div className="h-4 bg-[#1e2b36] rounded w-1/4" />
          <div className="h-6 bg-[#1e2b36] rounded w-3/4" />
          <div className="h-3 bg-[#1e2b36] rounded w-1/2" />
        </div>
        <div className="h-10 bg-[#1e2b36] rounded-lg w-32 hidden sm:block" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 space-y-2">
            <div className="h-3 bg-[#1e2b36] rounded w-1/2" />
            <div className="h-7 bg-[#1e2b36] rounded w-3/4" />
            <div className="h-2 bg-[#1e2b36] rounded w-1/3" />
          </div>
        ))}
      </div>

      {/* Main Chart Area Skeleton */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-[#1e2b36] rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-8 bg-[#1e2b36] rounded w-20" />
            <div className="h-8 bg-[#1e2b36] rounded w-20" />
          </div>
        </div>
        <div className="h-72 bg-[#0a0f14] rounded-lg border border-[#1e2b36]/60 flex items-center justify-center">
          <div className="text-xs text-[#7a8b99] tracking-wider">LOADING MARKET TELEMETRY &amp; RECHARTS TRENDS...</div>
        </div>
      </div>
    </div>
  );
}

export function RadarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse font-mono">
      {/* Search Bar Skeleton */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="h-11 bg-[#0a0f14] rounded-lg border border-[#1e2b36] flex-1" />
          <div className="h-11 bg-[#0a0f14] rounded-lg border border-[#1e2b36] w-44" />
          <div className="h-11 bg-[#22d3a5]/20 rounded-lg w-32" />
        </div>
        <div className="flex gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-[#0a0f14] rounded-full w-24" />
          ))}
        </div>
      </div>

      {/* Globe & Job List Split Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 panel bg-[#111a22] border border-[#1e2b36] rounded-xl h-96 flex items-center justify-center">
          <div className="text-xs text-[#7a8b99]">INITIALIZING 3D GEOSPATIAL GLOBE...</div>
        </div>
        <div className="lg:col-span-7 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between">
                <div className="h-4 bg-[#1e2b36] rounded w-1/2" />
                <div className="h-4 bg-[#1e2b36] rounded w-20" />
              </div>
              <div className="h-3 bg-[#1e2b36] rounded w-3/4" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 bg-[#0a0f14] rounded w-24" />
                <div className="h-5 bg-[#0a0f14] rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
