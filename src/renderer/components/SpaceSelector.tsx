import { useState, useRef, useEffect } from "react";
import {
  FolderOpen,
  Plus,
  Settings,
  ChevronDown,
  Edit3,
  Trash2,
  FileText,
  Clock,
  Check,
  X,
  Search,
  Lock,
  Globe,
  Share2,
} from "lucide-react";
import { useSpaceStore } from "../store/useSpaceStore";
import type { Space, SpaceVisibility } from "../../shared/types";
import SpaceIcon from "./icons/SpaceIcon";

interface SpaceSelectorProps {
  onOpenSpaceSettings: () => void;
  onOpenFilesPanel: () => void;
  onOpenTasksPanel: () => void;
}

const SpaceSelector = ({
  onOpenSpaceSettings,
  onOpenFilesPanel,
  onOpenTasksPanel,
}: SpaceSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDescription, setNewSpaceDescription] = useState("");
  const [newSpaceVisibility, setNewSpaceVisibility] = useState<SpaceVisibility>("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSpace, setEditingSpace] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    spaces,
    currentSpaceId,
    currentSpace,
    setCurrentSpace,
    createSpace,
    deleteSpace,
    updateSpace,
  } = useSpaceStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSpace = () => {
    if (!newSpaceName.trim()) return;

    createSpace(newSpaceName, {
      description: newSpaceDescription,
      visibility: newSpaceVisibility,
    });

    setNewSpaceName("");
    setNewSpaceDescription("");
    setNewSpaceVisibility("private");
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleDeleteSpace = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this space? All files and tasks will be removed.")) {
      deleteSpace(spaceId);
    }
  };

  const handleEditSpace = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSpace(space.id);
    setEditName(space.name);
  };

  const handleSaveEdit = (spaceId: string) => {
    if (editName.trim()) {
      updateSpace(spaceId, { name: editName.trim() });
    }
    setEditingSpace(null);
  };

  const handleCancelEdit = () => {
    setEditingSpace(null);
    setEditName("");
  };

  const getVisibilityIcon = (visibility: SpaceVisibility) => {
    switch (visibility) {
      case "private":
        return <Lock size={12} />;
      case "shared":
        return <Share2 size={12} />;
      case "public":
        return <Globe size={12} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated transition-all duration-200 group"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium shrink-0"
          style={{ backgroundColor: currentSpace?.color || "#6366F1" }}
        >
          <SpaceIcon icon={currentSpace?.icon} size={16} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-text truncate">
              {currentSpace?.name || "All Conversations"}
            </span>
            {currentSpace && (
              <span className="text-text-muted">
                {getVisibilityIcon(currentSpace.visibility)}
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-muted truncate">
            {currentSpace
              ? `${currentSpace.files.length} files · ${currentSpace.conversationIds.length} chats`
              : "No space selected"}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-xl border border-border shadow-lg shadow-black/20 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spaces..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-elevated/50 border border-border text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Spaces List */}
          <div className="max-h-64 overflow-y-auto p-2">
            {/* Default Option - All Conversations */}
            <button
              onClick={() => {
                setCurrentSpace(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                !currentSpaceId
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-surface-elevated/50 text-text-secondary"
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-surface-elevated flex items-center justify-center shrink-0">
                <FolderOpen size={14} />
              </div>
              <span className="text-sm">All Conversations</span>
              {!currentSpaceId && <Check size={14} className="ml-auto" />}
            </button>

            <div className="h-px bg-border my-2" />

            {/* User Spaces */}
            {filteredSpaces.map((space) => (
              <div key={space.id}>
                {editingSpace === space.id ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8 px-2 rounded border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(space.id);
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <button
                      onClick={() => handleSaveEdit(space.id)}
                      className="p-1.5 rounded hover:bg-primary/10 text-primary"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded hover:bg-error/10 text-error"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setCurrentSpace(space.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left group transition-colors ${
                      currentSpaceId === space.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-surface-elevated/50 text-text-secondary"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-white text-xs"
                      style={{ backgroundColor: space.color || "#6366F1" }}
                    >
                      <SpaceIcon icon={space.icon} size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {space.name}
                        </span>
                        <span className="text-text-muted">
                          {getVisibilityIcon(space.visibility)}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        {space.files.length} files · {space.conversationIds.length} chats
                      </p>
                    </div>
                    {currentSpaceId === space.id && <Check size={14} className="ml-auto" />}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditSpace(space, e)}
                        className="p-1.5 rounded hover:bg-surface-elevated text-text-muted hover:text-text"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSpace(space.id, e)}
                        className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </button>
                )}
              </div>
            ))}

            {filteredSpaces.length === 0 && searchQuery && (
              <p className="px-3 py-4 text-sm text-text-muted text-center">
                No spaces found
              </p>
            )}
          </div>

          {/* Create New Space */}
          {isCreating ? (
            <div className="p-3 border-t border-border bg-surface-elevated/30">
              <input
                type="text"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                placeholder="Space name..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 mb-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSpace();
                  if (e.key === "Escape") setIsCreating(false);
                }}
              />
              <input
                type="text"
                value={newSpaceDescription}
                onChange={(e) => setNewSpaceDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 mb-2"
              />
              <select
                value={newSpaceVisibility}
                onChange={(e) => setNewSpaceVisibility(e.target.value as SpaceVisibility)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-surface text-sm mb-2"
              >
                <option value="private">Private</option>
                <option value="shared">Shared</option>
                <option value="public">Public</option>
              </select>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateSpace}
                  disabled={!newSpaceName.trim()}
                  className="flex-1 h-8 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="h-8 px-3 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-elevated"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 px-4 py-3 border-t border-border hover:bg-surface-elevated/50 transition-colors text-text-secondary"
            >
              <Plus size={16} className="text-primary" />
              <span className="text-sm font-medium">Create New Space</span>
            </button>
          )}

          {/* Current Space Actions */}
          {currentSpace && (
            <div className="grid grid-cols-3 border-t border-border">
              <button
                onClick={() => {
                  onOpenSpaceSettings();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-1 py-3 hover:bg-surface-elevated/50 transition-colors text-text-secondary"
              >
                <Settings size={16} />
                <span className="text-[11px]">Settings</span>
              </button>
              <button
                onClick={() => {
                  onOpenFilesPanel();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-1 py-3 hover:bg-surface-elevated/50 transition-colors text-text-secondary border-x border-border"
              >
                <FileText size={16} />
                <span className="text-[11px]">Files</span>
              </button>
              <button
                onClick={() => {
                  onOpenTasksPanel();
                  setIsOpen(false);
                }}
                className="flex flex-col items-center gap-1 py-3 hover:bg-surface-elevated/50 transition-colors text-text-secondary"
              >
                <Clock size={16} />
                <span className="text-[11px]">Tasks</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpaceSelector;
