import React from 'react';

interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Escapes special characters for use inside a RegExp.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * HighlightText component splits text based on whitespace-delimited query tokens
 * and wraps matches in a high-contrast cyber-styled <mark> tag.
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query = '',
  className = '',
  highlightClassName = 'bg-[#22d3a5]/25 text-[#22d3a5] px-1 py-0.5 rounded font-semibold border border-[#22d3a5]/40 font-mono',
}) => {
  if (!text) return null;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Extract non-empty tokens (stripping quotes/commas/punctuation), deduplicate, and escape regex chars
  const tokens = Array.from(
    new Set(
      query
        .replace(/["'`()]+/g, ' ')
        .trim()
        .split(/[\s,;|/]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
    )
  ).map(escapeRegExp);

  if (tokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build case-insensitive matching group
  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // If this part matches any of the tokens case-insensitively, highlight it
        const isMatch = tokens.some(
          (token) => part.toLowerCase() === token.toLowerCase().replace(/\\/g, '')
        );

        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default HighlightText;
