import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Pencil,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Bot,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CitationMarker } from "./Citation";
import StructuredResponse from "./StructuredResponse";
import { Citation, Source } from "../../shared/types";

// Function to render content with citations
const renderContentWithCitations = (content: string, citations: Citation[]) => {
  if (!citations || citations.length === 0) {
    return content;
  }

  // For now, add citations at the end of the content
  // TODO: Implement proper citation positioning based on text matching
  let result = content;

  // Add citations section at the end
  if (citations.length > 0) {
    result += "\n\n---\n";
    citations.forEach((citation, index) => {
      result += `<sup class="citation-marker" data-citation-id="${citation.id}">[${index + 1}]</sup> `;
    });
  }

  return result;
};

interface MessageBubbleProps {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date | string;
  citations?: Citation[];
  sources?: Source[];
  headline?: string;
  summary?: string;
  useStructuredView?: boolean;
  onCopy?: (content: string, includeCitations?: boolean) => void;
  onRegenerate?: () => void;
  onFeedback?: (type: "up" | "down") => void;
  onDelete?: () => void;
  onEdit?: (updated: string) => void;
  onCitationClick?: (sourceId: string) => void;
  onSourceClick?: (sourceId: string) => void;
}

const MessageBubble = ({
  id,
  message,
  isUser,
  timestamp,
  citations,
  sources,
  headline,
  summary,
  useStructuredView = false,
  onCopy,
  onRegenerate,
  onFeedback,
  onDelete,
  onEdit,
  onCitationClick,
  onSourceClick,
}: MessageBubbleProps) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const copyOptionsRef = useRef<HTMLDivElement>(null);

  // Close copy options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        copyOptionsRef.current &&
        !copyOptionsRef.current.contains(event.target as Node)
      ) {
        setShowCopyOptions(false);
      }
    };

    if (showCopyOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCopyOptions]);

  const getContentWithCitations = (includeCitations: boolean) => {
    if (!includeCitations || !citations || citations.length === 0) {
      return message;
    }
    return renderContentWithCitations(message, citations);
  };

  const handleCopyMessage = async (includeCitations: boolean = false) => {
    try {
      const content = getContentWithCitations(includeCitations);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.(content, includeCitations);
      setShowCopyOptions(false);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const content = getContentWithCitations(includeCitations);
      onCopy?.(content, includeCitations);
      setShowCopyOptions(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback - do nothing
    }
  };

  const toggleTextToSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      // Try to set a pleasant voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            voice.name.toLowerCase().includes("female"),
        ) ||
        voices.find((voice) => voice.lang.startsWith("en")) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      data-message-id={id}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} ${
        isUser ? "animate-slide-in-right" : "animate-slide-in-left"
      }`}
    >
      {/* Premium Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center shadow-sm">
            <User size={18} className="text-text-secondary" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
            <Bot size={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex-1 ${isUser ? "items-end" : "items-start"} flex flex-col max-w-3xl`}
      >
        {/* Premium Message Bubble */}
        <div
          className={`group relative px-5 py-3.5 shadow-sm transition-all duration-200 ${
            isUser
              ? "message-bubble-user text-white"
              : "message-bubble-assistant"
          }`}
        >
          {editing ? (
            <div className="space-y-2 min-w-[280px]">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full min-h-24 resize-y rounded-lg border border-border bg-surface/70 px-3 py-2 text-sm text-text outline-none focus:ring-2 focus:ring-primary/30 chat-textarea"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setDraft(message);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md bg-surface border border-border hover:bg-surface/80 transition-colors text-text"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onEdit?.(draft.trim() || message);
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : isUser ? (
            <p className="text-[15px] leading-6 whitespace-pre-wrap break-words">
              {message}
            </p>
          ) : useStructuredView ? (
            <StructuredResponse
              headline={headline}
              summary={summary}
              content={message}
              sources={sources}
              citations={citations}
              onSourceClick={onSourceClick}
            />
          ) : (
            <div
              className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-6 prose-pre:my-3 prose-pre:rounded-xl prose-pre:border"
              style={{
                color: "var(--color-text)",
              }}
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const rawCode = String(children).replace(/\n$/, "");
                    const match = /language-(\w+)/.exec(className || "");

                    if (!match) {
                      return (
                        <code
                          className="rounded px-1.5 py-0.5 text-[13px] border"
                          style={{
                            backgroundColor: "var(--color-surface)",
                            color: "var(--color-text)",
                            borderColor: "var(--color-border)",
                          }}
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className="relative group/code">
                        <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyCode(rawCode)}
                            className="rounded-md px-2 py-1 text-[11px] transition-all duration-200 flex items-center gap-1 shadow-sm"
                            style={{
                              backgroundColor: "var(--color-surface)",
                              color: "var(--color-text)",
                              border: "1px solid var(--color-border)",
                            }}
                          >
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <div
                          className="absolute left-3 top-2 text-[10px] font-medium uppercase tracking-wider"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {match[1]}
                        </div>
                        <code
                          className={`${className} pt-8`}
                          style={{ color: "var(--color-text)" }}
                          {...rest}
                        >
                          {children}
                        </code>
                      </div>
                    );
                  },
                  sup(props) {
                    const { children, className, ...rest } = props;
                    const citationId = (
                      rest as { "data-citation-id"?: string }
                    )["data-citation-id"];

                    // Check if this is a citation marker
                    if (citationId && citations) {
                      const citationIndex = citations.findIndex(
                        (c) => c.id === citationId,
                      );
                      if (citationIndex !== -1) {
                        const citation = citations[citationIndex];
                        return (
                          <CitationMarker
                            citation={citation}
                            onClick={() =>
                              onCitationClick?.(citation.source.id)
                            }
                            index={citationIndex + 1}
                          />
                        );
                      }
                    }

                    // Regular superscript
                    return (
                      <sup className={className} {...rest}>
                        {children}
                      </sup>
                    );
                  },
                }}
              >
                {citations && citations.length > 0
                  ? renderContentWithCitations(message, citations)
                  : message}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Premium Action Bar */}
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
          <span className="text-[11px] mr-2 text-text-muted">
            {formattedTime}
          </span>

          <div className="relative" ref={copyOptionsRef}>
            <button
              onClick={() => {
                if (citations && citations.length > 0) {
                  setShowCopyOptions(!showCopyOptions);
                } else {
                  handleCopyMessage(false);
                }
              }}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-elevated/50 transition-all duration-200 text-text-muted hover:text-text"
              aria-label="Copy message"
              title="Copy"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </button>

            {showCopyOptions && citations && citations.length > 0 && (
              <div className="absolute bottom-full mb-1 right-0 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-10">
                <button
                  onClick={() => handleCopyMessage(false)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface/80 transition-colors text-text"
                >
                  Copy text only
                </button>
                <button
                  onClick={() => handleCopyMessage(true)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface/80 transition-colors text-text"
                >
                  Copy with citations
                </button>
              </div>
            )}
          </div>

          {!isUser && "speechSynthesis" in window && (
            <button
              onClick={toggleTextToSpeech}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-elevated/50 transition-all duration-200 text-text-muted hover:text-text"
              aria-label={isSpeaking ? "Stop text-to-speech" : "Read aloud"}
              title={isSpeaking ? "Stop reading" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

          {isUser ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-elevated/50 transition-all duration-200 text-text-muted hover:text-text"
                aria-label="Edit message"
                title="Edit"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={onDelete}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-error/10 transition-all duration-200 text-text-muted hover:text-error"
                aria-label="Delete message"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onRegenerate}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-surface-elevated/50 transition-all duration-200 text-text-muted hover:text-text"
                aria-label="Regenerate response"
                title="Regenerate"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => onFeedback?.("up")}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-success/10 transition-all duration-200 text-text-muted hover:text-success"
                aria-label="Like response"
                title="Helpful"
              >
                <ThumbsUp size={15} />
              </button>
              <button
                onClick={() => onFeedback?.("down")}
                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-error/10 transition-all duration-200 text-text-muted hover:text-error"
                aria-label="Dislike response"
                title="Not helpful"
              >
                <ThumbsDown size={15} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
