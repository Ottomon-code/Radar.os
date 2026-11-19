import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Table,
  Zap,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import {
  WEBSITE_ANNUAL_CAPABILITIES,
  downloadBulkCapabilitiesCsv,
  generateBulkCapabilitiesCsvString,
  CapabilityItem,
} from '../utils/bulkCapabilitiesCsv';
import { getBulkCapabilitiesCsvApiUrl } from '../utils/serverConfig';

interface CsvCapabilitiesPreviewPanelProps {
  onDownloadTriggered?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

const CATEGORIES = [
  'All Categories',
  'Platform & Modules',
  'Commercial & Licensing',
  'Salary Benchmarks (2026)',
  'Seniority Progression',
  'Skill Premiums',
  'Metropolitan Hubs',
  'Macro Trajectories (2020-2027)',
  'Enterprise Governance',
] as const;

export default function CsvCapabilitiesPreviewPanel({
  onDownloadTriggered,
  className = '',
  defaultExpanded = true,
}: CsvCapabilitiesPreviewPanelProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [rowsPerPage, setRowsPerPage] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return WEBSITE_ANNUAL_CAPABILITIES.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All Categories' || item.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.itemDescription.toLowerCase().includes(q) ||
        item.price.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * rowsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);

  const handleDownload = () => {
    downloadBulkCapabilitiesCsv();
    setDownloadSuccess(true);
    if (onDownloadTriggered) {
      onDownloadTriggered();
    }
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handleCopyCsv = () => {
    try {
      const csvContent = generateBulkCapabilitiesCsvString();
      navigator.clipboard.writeText(csvContent);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy CSV:', err);
    }
  };

  return (
    <div
      id="csv-capabilities-preview-panel"
      className={`panel bg-[#111a22] border border-[#1e2b36] rounded-xl shadow-xl overflow-hidden font-mono text-xs ${className}`}
    >
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-[#1e2b36] bg-[#0e161e] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/30 text-[#22d3a5] shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 tracking-wider">
                CSV STRUCTURE PREVIEW
              </span>
              <span className="text-[10px] text-[#7a8b99]">
                EXACT COLUMNS: <strong className="text-[#dce7f0]">'item name'</strong> |{' '}
                <strong className="text-[#dce7f0]">'item description'</strong> |{' '}
                <strong className="text-[#dce7f0]">'price'</strong>
              </span>
              <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/30">
                {WEBSITE_ANNUAL_CAPABILITIES.length} Capabilities
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#dce7f0] mt-1 flex items-center gap-2">
              <span>Annual Capabilities CSV Data Preview</span>
            </h3>
            <p className="text-[11px] text-[#7a8b99] mt-0.5 max-w-2xl leading-relaxed">
              Inspect formatted catalog entries and schema specifications before exporting. All 68
              capabilities adhere strictly to the 3-column CSV structure.
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg border border-[#1e2b36] bg-[#0a0f14] hover:bg-[#152330] text-[#7a8b99] hover:text-[#dce7f0] transition flex items-center gap-1.5 cursor-pointer"
            title={isExpanded ? 'Collapse preview table' : 'Expand preview table'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expand Preview</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyCsv}
            className="px-2.5 py-1.5 rounded-lg border border-[#1e2b36] bg-[#0a0f14] hover:bg-[#152330] text-[#7a8b99] hover:text-[#dce7f0] transition flex items-center gap-1.5 cursor-pointer"
            title="Copy full CSV content to clipboard"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                <span className="text-[#22d3a5] font-semibold">Copied CSV</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg border border-[#22d3a5] bg-[#22d3a5] text-black font-bold hover:bg-[#1eb88f] transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,165,0.25)] active:scale-95 cursor-pointer"
            title="Download full 68-row RFC 4180 CSV file"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Controls Bar: Search, Category Filter, and Rows Per Page */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36]">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#7a8b99] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by item name, description, or price..."
                className="w-full bg-[#111a22] border border-[#1e2b36] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#dce7f0] placeholder-[#506373] focus:outline-none focus:border-[#22d3a5]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8b99] hover:text-[#dce7f0] text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-[#7a8b99]">
                <Filter className="w-3 h-3 text-[#22d3a5]" />
                <span className="text-[11px] hidden sm:inline">Category:</span>
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#111a22] border border-[#1e2b36] rounded-md px-2.5 py-1.5 text-xs text-[#dce7f0] focus:outline-none focus:border-[#22d3a5] cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Rows Per Page */}
              <div className="flex items-center gap-1 text-[#7a8b99] pl-2 border-l border-[#1e2b36]">
                <span className="text-[11px] hidden sm:inline">Show:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#111a22] border border-[#1e2b36] rounded-md px-2 py-1.5 text-xs text-[#dce7f0] focus:outline-none focus:border-[#22d3a5] cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={68}>All (68)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formatted CSV Table */}
          <div className="overflow-x-auto rounded-lg border border-[#1e2b36] bg-[#0a0f14]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1e2b36] bg-[#0e161e] text-[11px] uppercase tracking-wider text-[#7a8b99]">
                  <th scope="col" className="py-2.5 px-4 font-bold text-[#22d3a5] w-[28%]">
                    <div className="flex items-center gap-1.5">
                      <span>item name</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 lowercase font-normal">
                        col 1
                      </span>
                    </div>
                  </th>
                  <th scope="col" className="py-2.5 px-4 font-bold text-[#38bdf8] w-[54%]">
                    <div className="flex items-center gap-1.5">
                      <span>item description</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 lowercase font-normal">
                        col 2
                      </span>
                    </div>
                  </th>
                  <th scope="col" className="py-2.5 px-4 font-bold text-[#fbbf24] text-right w-[18%]">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>price</span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 lowercase font-normal">
                        col 3
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2b36]/60">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, idx) => (
                    <tr
                      key={`${item.itemName}-${idx}`}
                      className="hover:bg-[#152330]/70 transition group"
                    >
                      {/* Column 1: item name */}
                      <td className="py-3 px-4 align-top font-semibold text-[#dce7f0]">
                        <div className="space-y-1">
                          <div className="group-hover:text-[#22d3a5] transition">
                            {item.itemName}
                          </div>
                          {item.category && (
                            <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-[#1e2b36] text-[#7a8b99] font-normal">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: item description */}
                      <td className="py-3 px-4 align-top text-[#94a3b8] leading-relaxed text-[11px]">
                        {item.itemDescription}
                      </td>

                      {/* Column 3: price */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <span className="font-bold text-[#22d3a5] bg-[#22d3a5]/10 px-2 py-0.5 rounded border border-[#22d3a5]/30">
                          {item.price}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[#7a8b99]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Table className="w-6 h-6 text-[#7a8b99]" />
                        <span>No capability items match "{searchQuery}"</span>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All Categories');
                          }}
                          className="mt-1 text-xs text-[#22d3a5] hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Status & Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-[#7a8b99] text-[11px]">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-[#dce7f0]">
                  {filteredItems.length === 0 ? 0 : startIndex + 1}–
                  {Math.min(startIndex + rowsPerPage, filteredItems.length)}
                </strong>{' '}
                of <strong className="text-[#dce7f0]">{filteredItems.length}</strong> items
              </span>
              {filteredItems.length !== WEBSITE_ANNUAL_CAPABILITIES.length && (
                <span className="text-[10px] text-[#7a8b99]">
                  (filtered from {WEBSITE_ANNUAL_CAPABILITIES.length} total)
                </span>
              )}
            </div>

            {/* Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] hover:bg-[#152330] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Prev
                </button>
                <span className="px-2 text-xs">
                  Page <strong className="text-[#dce7f0]">{safeCurrentPage}</strong> of{' '}
                  <strong className="text-[#dce7f0]">{totalPages}</strong>
                </span>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded bg-[#0a0f14] border border-[#1e2b36] text-[#dce7f0] hover:bg-[#152330] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Pre-Download Action Strip */}
          <div className="pt-3 border-t border-[#1e2b36] flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0e161e]/80 p-3 rounded-lg border border-[#1e2b36]/60">
            <div className="flex items-center gap-2 text-[#7a8b99] text-[11px]">
              <Check className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
              <span>
                Data is verified and ready for download. Output is encoded as standard RFC 4180 CSV
                compatible with Excel, Google Sheets, and data pipelines.
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={getBulkCapabilitiesCsvApiUrl()}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg border border-[#1e2b36] hover:border-[#38bdf8]/50 text-[#38bdf8] hover:bg-[#38bdf8]/10 transition flex items-center gap-1 text-[11px] font-semibold"
                title="Direct link to functional server endpoint"
              >
                <span>Server Endpoint</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={handleDownload}
                className="px-3.5 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1eb88f] text-black font-bold transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,165,0.3)] active:scale-95 cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download CSV (68 Items)</span>
              </button>
            </div>
          </div>

          {/* Download Notification Banner */}
          {downloadSuccess && (
            <div className="p-2.5 rounded bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5] flex items-center justify-between text-xs animate-pulse">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22d3a5]" />
                <span className="font-bold text-white">Download triggered:</span>
                <span>TalentRadar_Bulk_Annual_Capabilities.csv saved successfully.</span>
              </div>
              <span className="text-[10px] text-[#7a8b99]">item name,item description,price</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
