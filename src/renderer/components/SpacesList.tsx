import { useState, useCallback, memo } from "react";
import { useSpaceStore } from "../store/useSpaceStore";
import {
  Search,
  Plus,
  X,
  MoreHorizontal,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { Space } from "../../shared/types";
import SpaceIcon from "./icons/SpaceIcon";

const getColor = (id: string) => {
  const colors = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const formatLastActive = (date: Date | string) => {
  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

interface SpaceCardProps {
  space: Space;
  onOpen: () => void;
  onDelete: () => void;
}

const SpaceCard = memo(function SpaceCard({
  space,
  onOpen,
  onDelete,
}: SpaceCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(space.customInstructions || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    },
    [space.customInstructions]
  );

  return (
    <div
      onClick={onOpen}
      className="bg-surface-elevated rounded-xl border border-border hover:border-primary/30 transition-all duration-200 overflow-hidden flex flex-col h-52 cursor-pointer group"
    >
      <div className="p-5 flex-1">
        <div className="flex items-start space-x-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md"
            style={{ backgroundColor: space.color || getColor(space.id) }}
          >
            <SpaceIcon icon={space.icon} size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text truncate">
              {space.name}
            </h3>
            <p className="text-xs text-text-muted">
              {formatLastActive(space.updatedAt)}
            </p>
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded-full hover:bg-surface text-text-muted transition"
              aria-label="Actions"
            >
              <MoreHorizontal size={16} />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-36 bg-surface-elevated border border-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    onOpen();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface transition"
                >
                  Open Space
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    handleCopy(e);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface transition"
                >
                  {copied ? "Copied!" : "Copy Instructions"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActions(false);
                    onDelete();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 transition"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
          {space.customInstructions || "No instructions set"}
        </p>
      </div>
      <div className="px-5 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            S
          </div>
          <span className="text-xs text-text-muted">Owner</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-primary hover:text-primary/80 transition"
        >
          {copied ? "Copied!" : "Copy Instructions"}
        </button>
      </div>
    </div>
  );
});

export default function SpacesList() {
  const {
    spaces,
    setCurrentSpace,
    setSpacesViewOpen,
    createSpace,
    deleteSpace,
  } = useSpaceStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceInstructions, setNewSpaceInstructions] = useState("");
  const [suggestions, setSuggestions] = useState<string>("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  const filteredSpaces = spaces.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customInstructions &&
        s.customInstructions.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) return;
    createSpace(newSpaceName.trim(), {
      customInstructions: newSpaceInstructions.trim(),
    });
    setNewSpaceName("");
    setNewSpaceInstructions("");
    setShowNewSpaceModal(false);
    setSuggestions("");
  };

  const handleDelete = (spaceId: string) => {
    if (window.confirm("Are you sure you want to delete this space?")) {
      deleteSpace(spaceId);
    }
  };

  const handleOpenSpace = (spaceId: string) => {
    setCurrentSpace(spaceId);
    setSpacesViewOpen(false);
  };

  const handleSuggestSteps = () => {
    if (!newSpaceName.trim()) return;
    const defaultQuestions = [
      "What are common problems or tasks in this space?",
      "What tone and style should the AI adopt?",
      "What are the expected inputs and outputs?",
      "What should the AI avoid or be cautious about?",
      "What tools or frameworks are used in this space?",
    ];
    setGeneratingQuestions(true);
    setTimeout(() => {
      const generated = defaultQuestions.map((q) => "• " + q).join("\n");
      setSuggestions(generated);
      setGeneratingQuestions(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-surface border-b border-border z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSpacesViewOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition"
                aria-label="Go back"
              >
                <ArrowLeft size={20} className="text-text-secondary" />
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center font-bold text-sm text-white shadow-lg">
                S
              </div>
              <h1 className="text-lg font-semibold tracking-tight">Spaces</h1>
            </div>
            <button
              onClick={() => setShowNewSpaceModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm font-medium text-sm"
            >
              <Plus size={16} className="mr-2" />
              New Space
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-text">Your Spaces</h2>
            <p className="text-sm text-text-muted mt-1">
              Manage AI instruction environments for different tasks
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 bg-surface text-text w-64 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              onOpen={() => handleOpenSpace(space.id)}
              onDelete={() => handleDelete(space.id)}
            />
          ))}
          {filteredSpaces.length === 0 && (
            <div className="col-span-full text-center py-12 text-text-secondary">
              <p className="text-lg mb-2">No spaces found</p>
              <p className="text-sm">
                Try adjusting your search or create a new space
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Space Modal */}
      {showNewSpaceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text">Create New Space</h3>
                <button
                  onClick={() => {
                    setShowNewSpaceModal(false);
                    setSuggestions("");
                  }}
                  className="text-text-muted hover:text-text transition"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Space Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., AI Coding Agent"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 bg-surface text-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    Custom Instructions
                  </label>
                  <textarea
                    placeholder="Define how the AI should behave in this space..."
                    value={newSpaceInstructions}
                    onChange={(e) => setNewSpaceInstructions(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 bg-surface text-text resize-none"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    These instructions will automatically apply to all conversations
                    in this space.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCreateSpace}
                    disabled={!newSpaceName.trim()}
                    className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                  >
                    Create Space
                  </button>
                  <button
                    onClick={() => setShowNewSpaceModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface text-text font-medium transition"
                  >
                    Cancel
                  </button>
                </div>
                <div className="border-t border-border pt-4">
                  <button
                    onClick={handleSuggestSteps}
                    disabled={!newSpaceName.trim() || generatingQuestions}
                    className="w-full py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition text-left flex items-center gap-2"
                  >
                    <Sparkles size={16} />
                    {generatingQuestions
                      ? "Generating suggestions..."
                      : "Suggest Questions for AI"}
                  </button>
                </div>
                {suggestions && (
                  <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
                    <p className="text-sm text-text-muted mb-2">
                      Suggested Questions:
                    </p>
                    <ul className="text-sm text-text-secondary list-disc list-inside whitespace-pre-line">
                      {suggestions}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}