import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Cpu,
  Cloud,
  Code2,
  Pin,
  Search,
  ChevronDown,
  Check,
  X,
  Bot,
} from "lucide-react";
import type { ModelInfo } from "../../shared/types";

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

interface ModelWithMeta extends ModelInfo {
  tags: string[];
  badge?: string;
  description?: string;
  parameterSize?: string;
  speed: "fast" | "medium" | "slow";
  category: "local" | "cloud" | "coding";
  icon: React.ReactNode;
}

// Model metadata for rich display
const getModelMetadata = (model: ModelInfo): Partial<ModelWithMeta> => {
  const name = model.name.toLowerCase();
  const tags: string[] = [];
  let badge: string | undefined;
  let category: "local" | "cloud" | "coding" = "cloud";
  let speed: "fast" | "medium" | "slow" = "medium";
  let parameterSize: string | undefined;
  let description: string | undefined;
  let icon: React.ReactNode = <Bot size={16} />;

  // Determine provider-based defaults
  if (model.provider === "ollama") {
    category = "local";
    icon = <Cpu size={16} />;
    tags.push("Local");

    // Parameter size detection
    if (name.includes("70b")) {
      parameterSize = "70B";
      speed = "slow";
    } else if (name.includes("32b")) {
      parameterSize = "32B";
      speed = "medium";
    } else if (name.includes("13b") || name.includes("14b")) {
      parameterSize = "13B";
      speed = "fast";
    } else if (name.includes("8b") || name.includes("7b")) {
      parameterSize = "7-8B";
      speed = "fast";
      badge = "Fast";
    }
  } else {
    category = "cloud";
    icon = <Cloud size={16} />;
    tags.push("Cloud");
  }

  // Coding models detection
  if (
    name.includes("code") ||
    name.includes("coder") ||
    name.includes("deepseek-coder") ||
    name.includes("codellama") ||
    name.includes("qwen") && name.includes("coder") ||
    name.includes("phind") ||
    name.includes("wizardcoder")
  ) {
    category = "coding";
    icon = <Code2 size={16} />;
    tags.push("Coding");
    description = "Optimized for code generation";
    if (!badge) badge = "Coding";
  }

  // Specific model detection for special badges
  if (name.includes("llama") && name.includes("3.1") && name.includes("405b")) {
    badge = "Best";
    description = "State-of-the-art open model";
  } else if (name.includes("gpt-4") || name.includes("claude-3-opus")) {
    badge = "Best";
    speed = "medium";
    description = "Highest quality responses";
  } else if (name.includes("gpt-3.5") || name.includes("haiku")) {
    badge = "Fast";
    speed = "fast";
    description = "Quick responses";
  }

  // Reasoning models
  if (
    name.includes("deepseek-r") ||
    name.includes("o1") ||
    name.includes("reasoning")
  ) {
    tags.push("Reasoning");
    description = "Advanced reasoning capabilities";
    badge = "Think";
  }

  // Vision models
  if (name.includes("vision") || name.includes("vl") || name.includes(" multimodal")) {
    tags.push("Vision");
    description = description || "Supports image input";
  }

  return {
    tags,
    badge,
    category,
    speed,
    parameterSize,
    description,
    icon,
  };
};

const getBadgeColor = (badge?: string) => {
  switch (badge) {
    case "Best":
      return "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white";
    case "Fast":
      return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
    case "Coding":
      return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white";
    case "Think":
      return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
    case "Cheap":
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
    default:
      return "bg-surface-elevated text-text-secondary";
  }
};

const CategoryHeader = ({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated/50 border-b border-border">
    <div className="w-5 h-5 rounded flex items-center justify-center text-text-muted">
      {icon}
    </div>
    <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
      {title}
    </span>
    <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded">
      {count}
    </span>
  </div>
);

const ModelCard = ({
  model,
  isSelected,
  isPinned,
  onSelect,
  onPinToggle,
}: {
  model: ModelWithMeta;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onPinToggle: (e: React.MouseEvent) => void;
}) => {
  return (
    <button
      onClick={onSelect}
      className={`
        group relative w-full text-left px-3 py-2.5 mx-2 rounded-lg
        transition-colors duration-150
        ${
          isSelected
            ? "bg-primary/10"
            : "hover:bg-surface-elevated"
        }
      `}
    >
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r" />
      )}

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            ${
              isSelected
                ? "bg-primary text-white"
                : "bg-surface-elevated text-text-muted group-hover:text-primary"
            }
          `}
        >
          {model.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-sm truncate ${
                isSelected ? "text-primary" : "text-text"
              }`}
            >
              {model.name}
            </span>
            {model.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getBadgeColor(model.badge)}`}>
                {model.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{model.provider === "ollama" ? "Local" : "Cloud"} · {model.parameterSize || "Unknown"}</p>
        </div>

        {/* Selection indicator */}
        <div className="flex items-center gap-1">
          <button
            onClick={onPinToggle}
            className={`
              p-1.5 rounded transition-colors
              ${isPinned ? "text-primary" : "text-text-muted opacity-0 group-hover:opacity-100 hover:text-primary"}
            `}
            title={isPinned ? "Unpin model" : "Pin model"}
          >
            <Pin size={13} className={isPinned ? "fill-current" : ""} />
          </button>
          {isSelected && <Check size={16} className="text-primary" />}
        </div>
      </div>
    </button>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
    <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center mb-3">
      <Search size={24} className="text-text-muted" />
    </div>
    <p className="text-sm text-text-secondary">No models found</p>
    <p className="text-xs text-text-muted mt-1">
      Try adjusting your search terms
    </p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
    <p className="text-sm text-text-muted">Loading models...</p>
  </div>
);

export function ModelSelector({
  models,
  selectedModel,
  onSelect,
  disabled = false,
  isLoading = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedModels, setPinnedModels] = useState<Set<string>>(() => {
    // Load pinned models from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pinnedModels");
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    }
    return new Set<string>();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Persist pinned models
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pinnedModels", JSON.stringify([...pinnedModels]));
    }
  }, [pinnedModels]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Enhance models with metadata
  const enhancedModels = useMemo(() => {
    return models.map((model) => ({
      ...model,
      ...getModelMetadata(model),
    })) as ModelWithMeta[];
  }, [models]);

  // Filter models by search
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return enhancedModels;
    const query = searchQuery.toLowerCase();
    return enhancedModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query) ||
        model.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [enhancedModels, searchQuery]);

  // Categorize models
  const categorizedModels = useMemo(() => {
    const pinned = filteredModels.filter((m) => pinnedModels.has(m.id));
    const local = filteredModels.filter(
      (m) => m.category === "local" && !pinnedModels.has(m.id)
    );
    const cloud = filteredModels.filter(
      (m) => m.category === "cloud" && !pinnedModels.has(m.id)
    );
    const coding = filteredModels.filter(
      (m) => m.category === "coding" && !pinnedModels.has(m.id)
    );

    return { pinned, local, cloud, coding };
  }, [filteredModels, pinnedModels]);

  // Get selected model info
  const selectedModelInfo = useMemo(() => {
    return enhancedModels.find((m) => m.id === selectedModel);
  }, [enhancedModels, selectedModel]);

  const togglePin = useCallback((e: React.MouseEvent, modelId: string) => {
    e.stopPropagation();
    setPinnedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (modelId: string) => {
      onSelect(modelId);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          group flex items-center gap-2 h-9 px-3 rounded-lg
          transition-colors duration-150
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-surface-elevated"
          }
          ${isOpen ? "bg-primary/10" : ""}
        `}
      >
        <div
          className={`
            w-6 h-6 rounded flex items-center justify-center
            ${selectedModelInfo ? "bg-primary/15 text-primary" : "bg-surface-elevated text-text-muted"}
          `}
        >
          {selectedModelInfo?.icon || <Bot size={14} />}
        </div>
        <span className="text-sm font-medium max-w-[140px] truncate">
          {isLoading ? "Loading..." : selectedModelInfo?.name || selectedModel || "Select model"}
        </span>
        <ChevronDown size={16} className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="
            absolute bottom-full left-0 mb-2 w-[320px] max-w-[90vw]
            bg-surface border border-border rounded-xl
            shadow-xl overflow-hidden z-50
          "
        >
          {/* Header with Search */}
          <div className="p-2 border-b border-border bg-surface-elevated/30">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border focus-within:border-primary/30 transition-colors">
              <Search size={16} className="text-text-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1 rounded hover:bg-surface-elevated text-text-muted">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : filteredModels.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="py-1">
                {/* Pinned Models Section */}
                {categorizedModels.pinned.length > 0 && (
                  <>
                    <CategoryHeader
                      icon={<Pin size={14} className="text-primary" />}
                      title="Pinned"
                      count={categorizedModels.pinned.length}
                    />
                    {categorizedModels.pinned.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        isPinned={true}
                        onSelect={() => handleSelect(model.id)}
                        onPinToggle={(e) => togglePin(e, model.id)}
                      />
                    ))}
                  </>
                )}

                {/* Local Models Section */}
                {categorizedModels.local.length > 0 && (
                  <>
                    <CategoryHeader
                      icon={<Cpu size={14} className="text-emerald-500" />}
                      title="Local"
                      count={categorizedModels.local.length}
                    />
                    {categorizedModels.local.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        isPinned={pinnedModels.has(model.id)}
                        onSelect={() => handleSelect(model.id)}
                        onPinToggle={(e) => togglePin(e, model.id)}
                      />
                    ))}
                  </>
                )}

                {/* Cloud Models Section */}
                {categorizedModels.cloud.length > 0 && (
                  <>
                    <CategoryHeader
                      icon={<Cloud size={14} className="text-blue-500" />}
                      title="Cloud"
                      count={categorizedModels.cloud.length}
                    />
                    {categorizedModels.cloud.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        isPinned={pinnedModels.has(model.id)}
                        onSelect={() => handleSelect(model.id)}
                        onPinToggle={(e) => togglePin(e, model.id)}
                      />
                    ))}
                  </>
                )}

                {/* Coding Models Section */}
                {categorizedModels.coding.length > 0 && (
                  <>
                    <CategoryHeader
                      icon={<Code2 size={14} className="text-violet-500" />}
                      title="Coding"
                      count={categorizedModels.coding.length}
                    />
                    {categorizedModels.coding.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        isPinned={pinnedModels.has(model.id)}
                        onSelect={() => handleSelect(model.id)}
                        onPinToggle={(e) => togglePin(e, model.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border bg-surface-elevated/30 flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px]">↑↓</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px]">↵</kbd>
            </span>
            <span>{filteredModels.length} models</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
