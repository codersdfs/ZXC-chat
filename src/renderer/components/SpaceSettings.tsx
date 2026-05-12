import { useState, useEffect } from "react";
import {
  X,
  Save,
  Palette,
  MessageSquare,
  Search,
  Bot,
  Lock,
  Share2,
  Globe,
  Users,
  Sparkles,
} from "lucide-react";
import { useSpaceStore } from "../store/useSpaceStore";
import type { SpaceVisibility, ModelProvider } from "../../shared/types";
import SpaceIcon from "./icons/SpaceIcon";

interface SpaceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS = [
  "📁",
  "💼",
  "📚",
  "🔬",
  "💻",
  "🎨",
  "📝",
  "🎯",
  "🚀",
  "⭐",
  "🔥",
  "💡",
  "⚙️",
  "🔧",
  "📊",
  "🎓",
];

const COLORS = [
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#0EA5E9", // Sky
  "#14B8A6", // Teal
];

const SpaceSettings = ({ isOpen, onClose }: SpaceSettingsProps) => {
  const { currentSpace, currentSpaceId, updateSpace } = useSpaceStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [visibility, setVisibility] = useState<SpaceVisibility>("private");
  const [customInstructions, setCustomInstructions] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [defaultProvider, setDefaultProvider] = useState<ModelProvider>("ollama");
  const [searchSpaceFirst, setSearchSpaceFirst] = useState(true);
  const [includeFilesInContext, setIncludeFilesInContext] = useState(true);
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "sharing">("general");

  // Load current space data
  useEffect(() => {
    if (currentSpace) {
      setName(currentSpace.name);
      setDescription(currentSpace.description || "");
      setIcon(currentSpace.icon || "");
      setColor(currentSpace.color || "#6366F1");
      setVisibility(currentSpace.visibility);
      setCustomInstructions(currentSpace.customInstructions || "");
      setDefaultModel(currentSpace.defaultModel || "");
      setDefaultProvider(currentSpace.defaultProvider || "ollama");
      setSearchSpaceFirst(currentSpace.searchSpaceFirst);
      setIncludeFilesInContext(currentSpace.includeFilesInContext);
    }
  }, [currentSpace]);

  const handleSave = () => {
    if (!currentSpaceId) return;

    updateSpace(currentSpaceId, {
      name,
      description: description || undefined,
      icon,
      color,
      visibility,
      customInstructions: customInstructions || undefined,
      defaultModel: defaultModel || undefined,
      defaultProvider,
      searchSpaceFirst,
      includeFilesInContext,
    });

    onClose();
  };

  if (!isOpen || !currentSpace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: color }}
            >
              <SpaceIcon icon={icon} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Space Settings</h2>
              <p className="text-sm text-text-muted">
                Customize how this space behaves
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-elevated/50 transition-colors text-text-muted hover:text-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {[
            { id: "general", label: "General", icon: Palette },
            { id: "ai", label: "AI Behavior", icon: Sparkles },
            { id: "sharing", label: "Sharing", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary hover:text-text"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Name & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                    placeholder="Enter space name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
                    placeholder="What is this space about?"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        icon === emoji
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-surface-elevated/50 border-2 border-transparent hover:border-border"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Color Theme
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Sparkles size={14} className="text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AI Behavior Tab */}
          {activeTab === "ai" && (
            <div className="space-y-6">
              {/* Custom Instructions */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1.5">
                  <MessageSquare size={16} />
                  Custom Instructions
                </label>
                <p className="text-xs text-text-muted mb-2">
                  These instructions are added to every prompt in this space
                </p>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none font-mono text-sm"
                  placeholder="e.g., You are a helpful coding assistant. Always provide code examples with explanations."
                />
              </div>

              {/* Default Model */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text mb-1.5">
                  <Bot size={16} />
                  Default Model
                </label>
                <div className="flex gap-3">
                  <select
                    value={defaultProvider}
                    onChange={(e) => setDefaultProvider(e.target.value as ModelProvider)}
                    className="h-11 px-4 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="ollama">Ollama</option>
                    <option value="openrouter">OpenRouter</option>
                  </select>
                  <input
                    type="text"
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    placeholder="Model name (e.g., llama2, gpt-4)"
                    className="flex-1 h-11 px-4 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Context Settings */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-text">
                  <Search size={16} />
                  Context Search
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-elevated/30 cursor-pointer hover:bg-surface-elevated/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={searchSpaceFirst}
                    onChange={(e) => setSearchSpaceFirst(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text block">
                      Search space materials first
                    </span>
                    <span className="text-xs text-text-muted">
                      When asking questions, search this space&apos;s files and threads before
                      searching the web
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-surface-elevated/30 cursor-pointer hover:bg-surface-elevated/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeFilesInContext}
                    onChange={(e) => setIncludeFilesInContext(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-text block">
                      Include files in context
                    </span>
                    <span className="text-xs text-text-muted">
                      Automatically include relevant files when answering questions in this
                      space
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Sharing Tab */}
          {activeTab === "sharing" && (
            <div className="space-y-6">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-text mb-3">Visibility</label>
                <div className="space-y-2">
                  {[
                    {
                      value: "private",
                      label: "Private",
                      description: "Only you can access this space",
                      icon: Lock,
                    },
                    {
                      value: "shared",
                      label: "Shared",
                      description: "Invite specific people to collaborate",
                      icon: Share2,
                    },
                    {
                      value: "public",
                      label: "Public",
                      description: "Anyone with the link can view",
                      icon: Globe,
                    },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        visibility === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border bg-surface-elevated/30 hover:bg-surface-elevated/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value as SpaceVisibility)}
                        className="mt-1 w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <option.icon
                            size={16}
                            className={
                              visibility === option.value ? "text-primary" : "text-text-muted"
                            }
                          />
                          <span
                            className={`font-medium ${
                              visibility === option.value ? "text-primary" : "text-text"
                            }`}
                          >
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Members (placeholder for future collaboration feature) */}
              {visibility !== "private" && (
                <div className="p-4 rounded-xl bg-surface-elevated/30 border border-border">
                  <h4 className="text-sm font-medium text-text mb-2">Members</h4>
                  <p className="text-sm text-text-muted">
                    Member management coming soon. You&apos;ll be able to invite collaborators and
                    set permissions.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-elevated/20">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-elevated/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-10 px-6 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpaceSettings;
