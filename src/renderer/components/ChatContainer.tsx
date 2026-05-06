import {
  ArrowUp,
  Atom,
  Bot,
  Clipboard,
  Code,
  Copy,
  FileText,
  FolderTree,
  Globe,
  Lightbulb,
  Loader2,
  Menu,
  Mic,
  Paperclip,
  PanelRight,
  RefreshCw,
  Share2,
  Sparkles,
  Square,
  StickyNote,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import { CitationsPanel } from "./Citation";
import ModelSelector from "./ModelSelector";
import { useChatStore } from "../store/useChatStore";
import { useOllama } from "../hooks/useOllama";
import type { Attachment } from "../../shared/types";

interface ChatContainerProps {
  onOpenSidebar: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  onOpenSettings: () => void;
}

const defaultSuggestionPrompts = [
  "Summarize this week's priorities in bullet points.",
  "Write a professional email reply with a friendly tone.",
  "Explain this bug in simple steps and propose a fix.",
  "Create a 3-day learning plan for React performance.",
  "Help me brainstorm ideas for a new project.",
  "Review this code and suggest improvements.",
];

// Helper function to extract headline from content
const extractHeadline = (content: string): string | undefined => {
  const lines = content.split('\n').filter(line => line.trim());
  // Look for first heading (# or ##)
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.replace(/^#\s*/, '');
    }
    if (line.startsWith('## ')) {
      return line.replace(/^##\s*/, '');
    }
  }
  // If no heading, use first line as headline if it's short
  if (lines.length > 0 && lines[0].length < 100) {
    return lines[0];
  }
  return undefined;
};

// Helper function to extract summary from content
const extractSummary = (content: string): string | undefined => {
  const lines = content.split('\n').filter(line => line.trim());
  // Skip headings and look for first paragraph
  let inParagraph = false;
  const summaryLines: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('#')) {
      continue; // Skip headings
    }
    if (line.trim() === '') {
      if (inParagraph) break; // End of first paragraph
      continue;
    }
    inParagraph = true;
    summaryLines.push(line.trim());
    if (summaryLines.join(' ').length > 200) break; // Limit summary length
  }
  
  const summary = summaryLines.join(' ');
  return summary.length > 50 ? summary : undefined;
};

const ChatContainer = ({
  onOpenSidebar,
  rightPanelOpen,
  onToggleRightPanel,
  onOpenSettings,
}: ChatContainerProps) => {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    settings,
    availableModels,
    isLoadingModels,
    setSettings,
    updateMessage,
  } = useChatStore();
  const { sendMessage, regenerateResponse, clearConversation } = useOllama();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const [online, setOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const [showSearchSettings, setShowSearchSettings] = useState(false);
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  // Scroll-aware header state
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    const scroller = threadRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Scroll detection for header
  useEffect(() => {
    const scroller = threadRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      setIsScrolled(scroller.scrollTop > 20);
    };

    scroller.addEventListener("scroll", handleScroll);
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((!input.trim() && attachments.length === 0) || isLoading) return;
      await sendMessage(input, attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const {
      currentConversationId,
      messages: currentMessages,
      conversations,
    } = useChatStore.getState();
    const nextMessages = currentMessages.filter(
      (message) => message.id !== messageId,
    );

    useChatStore.setState({
      messages: nextMessages,
      conversations: currentConversationId
        ? conversations.map((conversation) =>
            conversation.id === currentConversationId
              ? {
                  ...conversation,
                  messages: nextMessages,
                  updatedAt: new Date(),
                }
              : conversation,
          )
        : conversations,
    });
  };

  const currentModel = useMemo(() => {
    if (isLoadingModels) return "";
    if (availableModels.length > 0) {
      const matchingModel = availableModels.find(
        (m) => m.id === settings.selectedModel,
      );
      if (matchingModel) {
        return matchingModel.id;
      }
      // Fallback to first model
      return availableModels[0].id;
    }
    return settings.selectedModel || "";
  }, [settings.selectedModel, availableModels, isLoadingModels]);

  const webSearchActive = Boolean(settings.webSearchEnabled && online);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + transcript);
        };

        setSpeechRecognition(recognition);
      }
    }
  }, []);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input/textarea
      const activeElement = document.activeElement as HTMLElement;
      const isInputActive =
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.contentEditable === "true";

      // Ctrl+N: New conversation
      if (e.ctrlKey && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        const { createConversation, setCurrentConversation } =
          useChatStore.getState();
        const newId = createConversation("New Chat");
        setCurrentConversation(newId);
        return;
      }

      // Ctrl+R: Regenerate response
      if (e.ctrlKey && e.key === "r" && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && messages.length > 0) {
          regenerateResponse();
        }
        return;
      }

      // Ctrl+Shift+C: Copy last assistant message
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        const lastAssistantMessage = messages
          .filter((m) => m.role === "assistant")
          .pop();
        if (lastAssistantMessage) {
          navigator.clipboard.writeText(lastAssistantMessage.content);
        }
        return;
      }

      // Ctrl+Shift+V: Toggle voice input
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        toggleVoiceInput();
        return;
      }

      // /: Focus input (when not in input)
      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        const textarea = document.querySelector(
          'textarea[placeholder*="Message AI assistant"]',
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
        return;
      }

      // Arrow key navigation between messages (when not in input)
      if (!isInputActive && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const messageElements = document.querySelectorAll("[data-message-id]");
        if (messageElements.length === 0) return;

        const currentIndex = Array.from(messageElements).findIndex((el) =>
          el.contains(document.activeElement),
        );

        let nextIndex;
        if (e.key === "ArrowUp") {
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : messageElements.length - 1;
        } else {
          nextIndex =
            currentIndex < messageElements.length - 1 ? currentIndex + 1 : 0;
        }

        const nextElement = messageElements[nextIndex] as HTMLElement;
        if (nextElement) {
          nextElement.focus();
          nextElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [messages, isLoading, regenerateResponse]);

  // Read file content as text
  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Handle file selection with content reading
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newAttachments: Attachment[] = [];
    for (const file of files) {
      try {
        const content = await readFileContent(file);
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const language = getLanguageFromExtension(ext);

        newAttachments.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: language ? "code" : "file",
          name: file.name,
          content: content,
          language,
          size: file.size,
        });
      } catch (err) {
        console.error("Failed to read file:", file.name, err);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    setShowAttachmentMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get programming language from file extension
  const getLanguageFromExtension = (ext: string): string | undefined => {
    const langMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      jsx: "jsx",
      tsx: "tsx",
      py: "python",
      rb: "ruby",
      java: "java",
      cpp: "cpp",
      c: "c",
      h: "c",
      hpp: "cpp",
      cs: "csharp",
      go: "go",
      rs: "rust",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      scala: "scala",
      r: "r",
      m: "objective-c",
      mm: "objective-c",
      html: "html",
      htm: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      json: "json",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      sql: "sql",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      md: "markdown",
      txt: "text",
    };
    return langMap[ext];
  };

  // Add clipboard content as attachment
  const addClipboardContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;

      setAttachments((prev) => [
        ...prev,
        {
          id: `clipboard-${Date.now()}`,
          type: "clipboard",
          name: "Clipboard",
          content: text,
        },
      ]);
      setShowAttachmentMenu(false);
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  // Add note as attachment
  const addNoteAttachment = () => {
    if (!noteInput.trim()) return;

    setAttachments((prev) => [
      ...prev,
      {
        id: `note-${Date.now()}`,
        type: "note",
        name: "Note",
        content: noteInput,
      },
    ]);
    setNoteInput("");
    setShowNoteInput(false);
    setShowAttachmentMenu(false);
  };

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Copy all attachments to clipboard
  const copyAllAttachments = async () => {
    if (attachments.length === 0) return;

    const allContent = attachments
      .map((att) => {
        const header =
          att.type === "code"
            ? `=== ${att.name} (${att.language}) ===`
            : `=== ${att.name} ===`;
        return `${header}\n${att.content}`;
      })
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(allContent);
    } catch (err) {
      console.error("Failed to copy attachments:", err);
    }
  };

  // Toggle voice input
  const toggleVoiceInput = () => {
    if (!speechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  };

  // Generate file structure (simplified)
  const generateFileStructure = () => {
    const structure = attachments
      .filter((a) => a.type === "file" || a.type === "code")
      .map((a) => a.name)
      .join("\n");

    if (!structure) return;

    setAttachments((prev) => [
      ...prev,
      {
        id: `structure-${Date.now()}`,
        type: "structure",
        name: "File Structure",
        content: `Attached files:\n${structure}`,
      },
    ]);
    setShowAttachmentMenu(false);
  };

  // Updated submit handler with attachments
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    await sendMessage(input, attachments);
    setInput("");
    setAttachments([]);
  };

  return (
    <div className="flex-1 flex min-w-0 bg-bg">
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`h-16 border-b border-border px-4 lg:px-6 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "glass border-border/50" : "bg-transparent border-transparent"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="h-10 w-10 rounded-xl hover:bg-surface-elevated/50 transition-all duration-200 flex items-center justify-center lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/20">
              <Bot size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">AI Assistant</p>
              <p className="text-xs text-text-muted truncate">
                Ready to help
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="h-10 w-10 rounded-xl hover:bg-surface-elevated/50 transition-all duration-200 flex items-center justify-center text-text-muted hover:text-text"
              onClick={onOpenSettings}
              aria-label="Open settings"
            >
              <WandSparkles size={18} />
            </button>
            <button
              className="h-10 w-10 rounded-xl hover:bg-surface-elevated/50 transition-all duration-200 flex items-center justify-center text-text-muted hover:text-text"
              aria-label="Share chat"
            >
              <Share2 size={18} />
            </button>
            <button
              className={`h-10 w-10 rounded-xl transition-all duration-200 flex items-center justify-center ${
                rightPanelOpen
                  ? "bg-primary/15 text-primary"
                  : "hover:bg-surface-elevated/50 text-text-muted hover:text-text"
              }`}
              onClick={onToggleRightPanel}
              aria-label="Toggle context panel"
            >
              <PanelRight size={18} />
            </button>
          </div>
        </header>

        {error && (
          <div className="mx-6 mt-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => useChatStore.getState().setError(null)}
              className="text-red-500 hover:text-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div ref={threadRef} className="flex-1 overflow-y-auto hero-gradient">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-1">
            {messages.length === 0 && (
              <div className="min-h-[60vh] flex flex-col items-center justify-center">
                {/* Premium Welcome Card */}
                <div className="welcome-card text-center p-10 sm:p-12 max-w-2xl animate-fade-in-up">
                  {/* Premium Icon */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                    <div className="relative w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-2xl shadow-primary/30">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* Premium Typography */}
                  <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
                    <span className="gradient-text">What can I help</span>
                    <br />
                    <span className="gradient-text">you with today?</span>
                  </h1>

                  <p className="text-base sm:text-lg text-text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
                    Your intelligent AI companion for coding, writing, analysis, and creative tasks.
                  </p>

                  {/* Premium Suggestion Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    {defaultSuggestionPrompts.slice(0, 4).map((prompt, index) => (
                      <button
                        key={prompt}
                        onClick={() => setInput(prompt)}
                        className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface hover:border-primary/30 transition-all duration-200 text-left"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          {index === 0 && <Code size={16} className="text-primary" />}
                          {index === 1 && <FileText size={16} className="text-primary" />}
                          {index === 2 && <Lightbulb size={16} className="text-primary" />}
                          {index === 3 && <Globe size={16} className="text-primary" />}
                        </div>
                        <span className="text-sm text-text-secondary group-hover:text-text transition-colors line-clamp-2">
                          {prompt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Premium Footer Text */}
                <p className="mt-8 text-sm text-text-muted animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  Press <kbd className="px-2 py-1 rounded-md bg-surface border border-border text-xs font-medium">⌘K</kbd> to start a new chat
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const isSameSender = prevMessage?.role === message.role;
              return (
                <div
                  key={message.id}
                  className={isSameSender ? "pt-1" : "pt-5"}
                >
                  <MessageBubble
                    id={message.id}
                    message={message.content}
                    isUser={message.role === "user"}
                    timestamp={message.timestamp}
                    citations={message.citations}
                    sources={message.sources}
                    headline={message.role === "assistant" ? extractHeadline(message.content) : undefined}
                    summary={message.role === "assistant" ? extractSummary(message.content) : undefined}
                    useStructuredView={message.role === "assistant" && (message.sources?.length || 0) > 0}
                    onRegenerate={
                      message.role === "assistant"
                        ? regenerateResponse
                        : undefined
                    }
                    onFeedback={() => {}}
                    onEdit={(updated) => updateMessage(message.id, updated)}
                    onDelete={() => handleDeleteMessage(message.id)}
                    onCitationClick={(sourceId) => {
                      setActiveSourceId(sourceId);
                    }}
                    onSourceClick={(sourceId) => {
                      setActiveSourceId(sourceId);
                    }}
                  />
                </div>
              );
            })}

            {(isLoading || isStreaming) && (
              <div className="flex gap-3 pt-6 animate-slide-in-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl rounded-bl-md bg-surface border border-border shadow-sm">
                  <span
                    className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-primary animate-typing-dot"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-glass">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {messages.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={regenerateResponse}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerate
                </button>
                <button
                  onClick={clearConversation}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-text hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Clear chat
                </button>
              </div>
            )}

            {attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-surface border border-border hover:border-primary/30 transition-colors"
                    >
                      {att.type === "code" && (
                        <FileText size={14} className="text-primary" />
                      )}
                      {att.type === "file" && (
                        <FileText size={14} className="text-text-secondary" />
                      )}
                      {att.type === "clipboard" && (
                        <Clipboard size={14} className="text-green-500" />
                      )}
                      {att.type === "note" && (
                        <StickyNote size={14} className="text-amber-500" />
                      )}
                      {att.type === "structure" && (
                        <FolderTree size={14} className="text-purple-500" />
                      )}
                      <span className="max-w-[150px] truncate">{att.name}</span>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                        aria-label={`Remove ${att.name}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyAllAttachments}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                    title="Copy all attachments to clipboard"
                  >
                    <Copy size={12} />
                    Copy all
                  </button>
                  <button
                    onClick={() => setAttachments([])}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Clear all attachments"
                  >
                    <Trash2 size={12} />
                    Clear all
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full min-w-0">
              <div
                className="chat-input-container px-5 pt-4 pb-3 min-w-0"
              >
                <textarea
                  value={input}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder="Message your AI assistant..."
                  disabled={isLoading}
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-text placeholder:text-text-muted outline-none min-h-[48px] max-h-36 px-1 chat-textarea transition-all duration-200"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  {/* Left side - Feature buttons */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* DeepThink Button */}
                    <button
                      type="button"
                      disabled={isLoading}
                      aria-pressed={settings.deepThinkEnabled}
                      aria-label={settings.deepThinkEnabled ? "Deep thinking on" : "Deep thinking off"}
                      title={settings.deepThinkEnabled ? "Deeper reasoning enabled" : "Enable deeper reasoning"}
                      onClick={() => {
                        if (isLoading) return;
                        setSettings({ deepThinkEnabled: !settings.deepThinkEnabled });
                      }}
                      className={`h-9 shrink-0 rounded-xl px-3 flex items-center gap-2 text-xs font-medium transition-all duration-200 ${
                        isLoading
                          ? "opacity-40 cursor-not-allowed"
                          : settings.deepThinkEnabled
                            ? "bg-primary/15 text-primary shadow-sm shadow-primary/20"
                            : "hover:bg-surface-elevated/50 text-text-muted hover:text-text"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${settings.deepThinkEnabled ? 'bg-primary/20' : 'bg-surface-elevated'}`}>
                        <Atom className="w-3 h-3 shrink-0" aria-hidden />
                      </div>
                      <span>DeepThink</span>
                    </button>

                    {/* Search Button */}
                    <button
                      type="button"
                      disabled={!online || isLoading}
                      aria-pressed={webSearchActive}
                      aria-label={online ? (settings.webSearchEnabled ? "Web search on" : "Web search off") : "Web search unavailable"}
                      title={online ? "Enable web search for this reply" : "Connect to enable web search"}
                      onClick={() => {
                        if (!online || isLoading) return;
                        setSettings({ webSearchEnabled: !settings.webSearchEnabled });
                      }}
                      className={`h-9 shrink-0 rounded-xl px-3 flex items-center gap-2 text-xs font-medium transition-all duration-200 ${
                        !online || isLoading
                          ? "opacity-40 cursor-not-allowed"
                          : webSearchActive
                            ? "bg-primary/15 text-primary shadow-sm shadow-primary/20"
                            : "hover:bg-surface-elevated/50 text-text-muted hover:text-text"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${webSearchActive ? 'bg-primary/20' : 'bg-surface-elevated'}`}>
                        <Globe className="w-3 h-3 shrink-0" strokeWidth={2} aria-hidden />
                      </div>
                      <span>Search</span>
                    </button>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />

                    {/* Attachment Button */}
                    <div className="relative" ref={attachmentMenuRef}>
                      <button
                        type="button"
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-surface-elevated/50 text-text-muted hover:text-text"
                        aria-label="Attach file or content"
                      >
                        <Paperclip className="w-[18px] h-[18px]" strokeWidth={2} />
                        {attachments.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 gradient-primary text-white text-[9px] rounded-full flex items-center justify-center font-medium shadow-sm">
                            {attachments.length}
                          </span>
                        )}
                      </button>

                      {showAttachmentMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-surface shadow-xl p-2 z-50 animate-fade-in-up">
                          <div className="space-y-1">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg transition-colors text-sm text-left"
                            >
                              <FileText size={16} className="text-primary" />
                              <span>Attach Files</span>
                            </button>
                            <button
                              onClick={addClipboardContent}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg transition-colors text-sm text-left"
                            >
                              <Clipboard size={16} className="text-green-500" />
                              <span>From Clipboard</span>
                            </button>
                            <button
                              onClick={() => setShowNoteInput(true)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg transition-colors text-sm text-left"
                            >
                              <StickyNote
                                size={16}
                                className="text-amber-500"
                              />
                              <span>Add Note</span>
                            </button>
                            {attachments.some(
                              (a) => a.type === "file" || a.type === "code",
                            ) && (
                              <button
                                onClick={generateFileStructure}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-bg transition-colors text-sm text-left"
                              >
                                <FolderTree
                                  size={16}
                                  className="text-purple-500"
                                />
                                <span>Add File Structure</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {showNoteInput && (
                        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-border bg-surface shadow-xl p-3 z-50 animate-fade-in-up">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Add Note
                            </span>
                            <button
                              onClick={() => setShowNoteInput(false)}
                              className="text-text-secondary hover:text-text"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Enter your note..."
                            className="w-full h-20 resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none mb-2"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowNoteInput(false)}
                              className="px-3 py-1.5 text-xs rounded-md bg-surface border border-border hover:bg-bg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={addNoteAttachment}
                              className="px-3 py-1.5 text-xs rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Model selector with provider indicator */}
                    <ModelSelector
                      models={availableModels}
                      selectedModel={currentModel}
                      onSelect={(modelId) => setSettings({ selectedModel: modelId })}
                      disabled={isLoading || isLoadingModels}
                      isLoading={isLoadingModels}
                    />

                    {/* Voice Input */}
                    {speechRecognition && (
                      <button
                        type="button"
                        onClick={toggleVoiceInput}
                        disabled={isLoading}
                        className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isListening
                            ? "bg-error/15 text-error animate-pulse"
                            : "hover:bg-surface-elevated/50 text-text-muted hover:text-text"
                        }`}
                        aria-label={isListening ? "Stop voice input" : "Start voice input"}
                      >
                        <Mic className="w-[18px] h-[18px]" />
                      </button>
                    )}

                    {/* Stop button */}
                    {(isLoading || isStreaming) && (
                      <button
                        type="button"
                        onClick={() => {/* TODO: implement stop */}}
                        className="h-9 w-9 shrink-0 rounded-xl bg-error/10 border border-error/30 text-error hover:bg-error/20 transition-all flex items-center justify-center"
                        aria-label="Stop streaming"
                      >
                        <Square className="w-4 h-4" fill="currentColor" />
                      </button>
                    )}

                    {/* Premium Send Button */}
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="chat-send-button h-11 w-11 shrink-0 rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Footer hint */}
                <p className="mt-2 px-1 text-[11px] text-text-muted">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {rightPanelOpen && (
        <aside className="hidden xl:flex w-[320px] border-l border-border glass-card flex-col bg-surface">
          <div className="p-4 border-b border-border edge-highlight">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary/60">
              Sources & Citations
            </h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {(() => {
                // Find the last user message with citations and sources
                const lastUserMessage = messages
                  .filter((m) => m.role === "user")
                  .reverse()
                  .find((m) => m.citations && m.citations.length > 0);

                if (lastUserMessage?.citations && lastUserMessage.sources) {
                  return (
                    <CitationsPanel
                      citations={lastUserMessage.citations}
                      sources={lastUserMessage.sources}
                      activeSourceId={activeSourceId}
                      onSourceClick={setActiveSourceId}
                    />
                  );
                }

                return (
                  <div className="rounded-xl border border-border/50 bg-surface/60 p-4 edge-highlight-inset">
                    <p className="text-sm font-medium mb-1 text-text-secondary">No Citations Yet</p>
                    <p className="text-xs text-secondary-muted">
                      Enable web search and ask a question to see citations here.
                    </p>
                  </div>
                );
              })()}
              <div className="rounded-xl border border-border/50 bg-surface/60 p-4 edge-highlight-inset">
                <p className="text-sm font-medium mb-2 text-text-secondary">Conversation Details</p>
                <div className="space-y-1">
                  <p className="text-xs text-secondary-muted">
                    Active model: <span className="text-text">{currentModel}</span>
                  </p>
                  <p className="text-xs text-secondary-muted">
                    Messages: <span className="text-text">{messages.length}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
      {showSearchSettings && (
        <div className="fixed bottom-20 left-4 glass-card rounded-xl p-4 z-20 w-72 edge-highlight">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-text">Search Settings</h3>
            <button
              onClick={() => setShowSearchSettings(false)}
              className="btn-secondary-muted h-6 w-6 rounded-full flex items-center justify-center"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border/50 bg-surface/60 p-3 text-xs text-secondary-muted edge-highlight-inset">
              Search source selection is automatic based on your query. General web search is used for time-sensitive and factual questions, while Wikipedia is preferred for stable background knowledge like definitions, history, and overviews.
            </div>

            <div>
              <label className="text-[11px] text-secondary-muted uppercase tracking-wider mb-1.5 block">
                Results to Include
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={settings.webSearchResults ?? 3}
                onChange={(e) =>
                  setSettings({
                    webSearchResults: Math.min(
                      5,
                      Math.max(1, parseInt(e.target.value) || 1),
                    ),
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-lg border border-border/50 bg-surface/80 input-recessed outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="text-[11px] text-secondary-muted uppercase tracking-wider mb-1.5 block">
                OpenRouter API Key
              </label>
              <input
                type="password"
                placeholder="OpenRouter API Key"
                value={settings.searchApiKeys?.openRouter ?? ""}
                onChange={(e) =>
                  setSettings({
                    searchApiKeys: {
                      ...settings.searchApiKeys,
                      openRouter: e.target.value,
                    },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-lg border border-border/50 bg-surface/80 input-recessed outline-none focus:border-primary/40"
              />
            </div>

            <div>
              <label className="text-[11px] text-secondary-muted uppercase tracking-wider mb-1.5 block">
                Google API Key
              </label>
              <input
                type="password"
                placeholder="Google API Key"
                value={settings.searchApiKeys?.google?.apiKey ?? ""}
                onChange={(e) =>
                  setSettings({
                    searchApiKeys: {
                      ...settings.searchApiKeys,
                      google: {
                        apiKey: e.target.value,
                        cx: settings.searchApiKeys?.google?.cx ?? "",
                      },
                    },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-lg border border-border/50 bg-surface/80 input-recessed outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] text-secondary-muted uppercase tracking-wider mb-1.5 block">
                Google Custom Search CX
              </label>
              <input
                type="text"
                placeholder="Google Custom Search CX"
                value={settings.searchApiKeys?.google?.cx ?? ""}
                onChange={(e) =>
                  setSettings({
                    searchApiKeys: {
                      ...settings.searchApiKeys,
                      google: {
                        apiKey: settings.searchApiKeys?.google?.apiKey ?? "",
                        cx: e.target.value,
                      },
                    },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-lg border border-border/50 bg-surface/80 input-recessed outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] text-secondary-muted uppercase tracking-wider mb-1.5 block">
                Bing API Key
              </label>
              <input
                type="password"
                placeholder="Bing API Key"
                value={settings.searchApiKeys?.bing ?? ""}
                onChange={(e) =>
                  setSettings({
                    searchApiKeys: {
                      ...settings.searchApiKeys,
                      bing: e.target.value,
                    },
                  })
                }
                className="w-full h-8 px-3 text-sm rounded-lg border border-border/50 bg-surface/80 input-recessed outline-none focus:border-primary/40"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
