import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, BookOpen, ExternalLink, Copy, Check } from "lucide-react";
import { Source, Citation } from "../../shared/types";

interface StructuredResponseProps {
  headline?: string;
  summary?: string;
  content: string;
  sources?: Source[];
  citations?: Citation[];
  onCitationClick?: (sourceId: string) => void;
  onSourceClick?: (sourceId: string) => void;
}

const StructuredResponse: React.FC<StructuredResponseProps> = ({
  headline,
  summary,
  content,
  sources = [],
  onSourceClick,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["summary", "content"]));
  const [copiedSourceId, setCopiedSourceId] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleCopySource = async (source: Source) => {
    const text = `${source.title}\n${source.url || ""}`;
    await navigator.clipboard.writeText(text);
    setCopiedSourceId(source.id);
    setTimeout(() => setCopiedSourceId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Headline Section */}
      {headline && (
        <div className="border-b border-border pb-4">
          <h2 className="text-2xl font-bold text-text mb-2">{headline}</h2>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="bg-surface-elevated/30 rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => toggleSection("summary")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <span className="font-semibold text-sm">Summary</span>
            </div>
            {expandedSections.has("summary") ? (
              <ChevronUp size={16} className="text-text-muted" />
            ) : (
              <ChevronDown size={16} className="text-text-muted" />
            )}
          </button>
          {expandedSections.has("summary") && (
            <div className="px-4 pb-4">
              <p className="text-sm text-text-secondary leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Answer Section */}
      <div className="bg-surface-elevated/30 rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => toggleSection("content")}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
        >
          <span className="font-semibold text-sm">Detailed Answer</span>
          {expandedSections.has("content") ? (
            <ChevronUp size={16} className="text-text-muted" />
          ) : (
            <ChevronDown size={16} className="text-text-muted" />
          )}
        </button>
        {expandedSections.has("content") && (
          <div className="px-4 pb-4">
            <div
              className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-6 prose-pre:my-3 prose-pre:rounded-xl prose-pre:border"
              style={{ color: "var(--color-text)" }}
            >
              <style>{`
                .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6,
                .prose p, .prose li, .prose strong, .prose em, .prose blockquote,
                .prose code, .prose pre {
                  color: var(--color-text);
                }
                .prose a {
                  color: var(--color-primary);
                }
                .prose pre {
                  background-color: var(--color-surface);
                  border-color: var(--color-border);
                }
                .prose blockquote {
                  border-left-color: var(--color-border);
                }
                .prose table th, .prose table td {
                  border-color: var(--color-border);
                }
                .prose hr {
                  border-color: var(--color-border);
                }
              `}</style>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Sources Section */}
      {sources && sources.length > 0 && (
        <div className="bg-surface-elevated/30 rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => toggleSection("sources")}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <span className="font-semibold text-sm">
                Sources ({sources.length})
              </span>
            </div>
            {expandedSections.has("sources") ? (
              <ChevronUp size={16} className="text-text-muted" />
            ) : (
              <ChevronDown size={16} className="text-text-muted" />
            )}
          </button>
          {expandedSections.has("sources") && (
            <div className="px-4 pb-4">
              <div className="space-y-3">
                {sources.map((source, index) => (
                  <div
                    key={source.id}
                    onClick={() => onSourceClick?.(source.id)}
                    className="p-3 rounded-lg bg-surface border border-border hover:border-primary/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-medium text-text truncate">
                            {source.title}
                          </h4>
                        </div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-text-secondary hover:text-primary flex items-center gap-1 truncate"
                          >
                            <ExternalLink size={10} />
                            {source.url}
                          </a>
                        )}
                        {source.metadata?.snippet && (
                          <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                            {source.metadata.snippet}
                          </p>
                        )}
                        {source.metadata?.source && (
                          <span className="text-xs text-text-muted mt-1 inline-block">
                            Source: {source.metadata.source}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopySource(source)}
                        className="shrink-0 p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text transition-colors"
                        title="Copy source"
                      >
                        {copiedSourceId === source.id ? (
                          <Check size={14} className="text-success" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StructuredResponse;
