import React from "react";
import { Citation } from "../../shared/types";

interface CitationMarkerProps {
  citation: Citation;
  onClick: () => void;
  index: number;
}

export const CitationMarker: React.FC<CitationMarkerProps> = ({ citation, onClick, index }) => {
  return (
    <sup
      className="cursor-pointer text-blue-500 hover:text-blue-700 underline decoration-dotted"
      onClick={onClick}
      title={`Source: ${citation.source.title}`}
    >
      [{index}]
    </sup>
  );
};

interface SourceCardProps {
  source: Citation["source"];
  isActive: boolean;
  onClick: () => void;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, isActive, onClick }) => {
  return (
    <div
      className={`p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
        isActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"
      }`}
      onClick={onClick}
    >
      <h4 className="font-medium text-sm mb-1">{source.title}</h4>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 break-words"
        >
          {source.url}
        </a>
      )}
      {source.metadata?.snippet && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {source.metadata.snippet}
        </p>
      )}
      {source.metadata?.source && (
        <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">
          Source: {source.metadata.source}
        </span>
      )}
    </div>
  );
};

interface CitationsPanelProps {
  citations: Citation[];
  sources: Citation["source"][];
  activeSourceId: string | null;
  onSourceClick: (sourceId: string) => void;
}

export const CitationsPanel: React.FC<CitationsPanelProps> = ({
  citations,
  sources,
  activeSourceId,
  onSourceClick,
}) => {
  if (sources.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
        No sources for this message
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Sources</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {citations.length} citation{citations.length !== 1 && "s"} from {sources.length} source{sources.length !== 1 && "s"}
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            isActive={activeSourceId === source.id}
            onClick={() => onSourceClick(source.id)}
          />
        ))}
      </div>
    </div>
  );
};