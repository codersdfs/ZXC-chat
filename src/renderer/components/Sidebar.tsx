import { MessageSquare, Settings, Sun, Moon, Plus, Trash2, Search, X, Sparkles, ChevronDown, ChevronRight, FolderOpen, Folder, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useChatStore } from "../store/useChatStore";
import { useSpaceStore } from "../store/useSpaceStore";
import SpaceSelector from "./SpaceSelector";
import SpaceFiles from "./SpaceFiles";
import SpaceSettings from "./SpaceSettings";
import TasksPanel from "./TasksPanel";
import type { ChatConversation } from "../../shared/types";
import SpaceIcon from "./icons/SpaceIcon";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface SpaceWithConversations {
  space: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  conversations: ChatConversation[];
}

const Sidebar = ({ isOpen, onClose, onOpenSettings }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [filesPanelOpen, setFilesPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [tasksPanelOpen, setTasksPanelOpen] = useState(false);
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());

  // Helper to get store state for linking conversations
  const linkConversation = (spaceId: string, conversationId: string) => {
    useSpaceStore.getState().linkConversation(spaceId, conversationId);
  };

  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createConversation,
    deleteConversation,
  } = useChatStore();

  const { spaces, currentSpaceId, setCurrentSpace, setSpacesViewOpen } = useSpaceStore();

  // Group conversations by spaces
  const spacesWithConversations = useMemo((): SpaceWithConversations[] => {
    const result: SpaceWithConversations[] = [];

    // Add conversations for each space
    spaces.forEach((space) => {
      const spaceConversations = conversations.filter(
        (conv) => conv.spaceId === space.id || space.conversationIds.includes(conv.id)
      );
      
      if (spaceConversations.length > 0) {
        result.push({
          space: {
            id: space.id,
            name: space.name,
            icon: space.icon,
            color: space.color,
          },
          conversations: spaceConversations,
        });
      }
    });

    // Add unlinked conversations (no space)
    const unlinkedConversations = conversations.filter(
      (conv) => !conv.spaceId && !spaces.some((s) => s.conversationIds.includes(conv.id))
    );
    
    if (unlinkedConversations.length > 0) {
      result.push({
        space: {
          id: "unlinked",
          name: "General",
          icon: "💬",
          color: "#6B7280",
        },
        conversations: unlinkedConversations,
      });
    }

    return result;
  }, [conversations, spaces]);

  // Filter based on search
  const filteredSpaces = useMemo(() => {
    if (!search) return spacesWithConversations;
    
    return spacesWithConversations
      .map((item) => ({
        ...item,
        conversations: item.conversations.filter((conv) =>
          conv.name.toLowerCase().includes(search.toLowerCase()) ||
          item.space.name.toLowerCase().includes(search.toLowerCase())
        ),
      }))
      .filter((item) => item.conversations.length > 0);
  }, [spacesWithConversations, search]);

  // Toggle space expansion
  const toggleSpaceExpansion = (spaceId: string) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const handleNewChat = () => {
    const id = createConversation("New Chat");
    // If in a space, link the conversation to the space
    if (currentSpaceId) {
      linkConversation(currentSpaceId, id);
    }
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id);
    onClose();
  };

  const handleSelectSpace = (spaceId: string) => {
    setCurrentSpace(spaceId === "unlinked" ? null : spaceId);
    // Clear current conversation to show SpaceView
    setCurrentConversation(null);
    onClose();
  };

  const renderSpaceItem = (item: SpaceWithConversations) => {
    const isExpanded = expandedSpaces.has(item.space.id);
    const isActiveSpace = currentSpaceId === item.space.id || (item.space.id === "unlinked" && !currentSpaceId);

    return (
      <div key={item.space.id} className="mb-2">
        {/* Space Header */}
        <button
          onClick={() => {
            toggleSpaceExpansion(item.space.id);
            handleSelectSpace(item.space.id);
          }}
          className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all duration-200 ${
            isActiveSpace
              ? "bg-primary/5 text-primary"
              : "text-text-secondary hover:bg-surface-elevated/50 hover:text-text"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs"
              style={{ backgroundColor: item.space.color || "#6366F1" }}
            >
              <SpaceIcon icon={item.space.icon} size={14} />
            </div>
            <span className="text-sm font-medium truncate">{item.space.name}</span>
            <span className="text-xs text-text-muted">({item.conversations.length})</span>
          </div>
          {isExpanded ? (
            <ChevronDown size={14} className="shrink-0" />
          ) : (
            <ChevronRight size={14} className="shrink-0" />
          )}
        </button>

        {/* Nested Conversations */}
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center rounded-lg transition-all duration-200 ${
                  currentConversationId === conversation.id
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-elevated/30"
                }`}
              >
                <button
                  onClick={() => handleSelectConversation(conversation.id)}
                  className="flex-1 px-3 py-2 text-left flex items-center gap-2.5 min-w-0"
                >
                  {isExpanded ? (
                    <FolderOpen size={14} className="shrink-0 text-text-muted" />
                  ) : (
                    <Folder size={14} className="shrink-0 text-text-muted" />
                  )}
                  <MessageSquare size={14} className="shrink-0" />
                  <span className="text-sm truncate">{conversation.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="p-1.5 mr-1 opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-error transition-all rounded hover:bg-error/10"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      )}
      <aside
        className={`fixed lg:static left-0 top-0 z-30 h-full w-80 flex flex-col transform transition-transform duration-300 ease-out bg-surface ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Edge highlight at top */}
        <div className="edge-highlight flex-1 flex flex-col p-5 overflow-hidden border-r border-border">
          {/* Premium Header */}
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">AI Assistant</h1>
                <p className="text-[11px] text-text-muted -mt-0.5">Powered by AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg ghost-hover flex items-center justify-center text-text-secondary transition-all duration-200 hover:scale-105"
                aria-label="Toggle theme"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg ghost-hover flex items-center justify-center text-text-secondary lg:hidden transition-all duration-200 hover:scale-105"
                aria-label="Close sidebar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Space Selector */}
          <div className="mb-4 shrink-0">
            <SpaceSelector
              onOpenSpaceSettings={() => setSettingsPanelOpen(true)}
              onOpenFilesPanel={() => setFilesPanelOpen(true)}
              onOpenTasksPanel={() => setTasksPanelOpen(true)}
            />
          </div>

          {/* Spaces List Button */}
          <button
            onClick={() => setSpacesViewOpen(true)}
            className="w-full h-11 mb-3 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text transition-all duration-200 flex items-center justify-center gap-2 font-medium shrink-0"
          >
            <LayoutGrid size={18} />
            <span>All Spaces</span>
          </button>

          {/* Premium New Chat Button */}
          <button
            onClick={handleNewChat}
            className="w-full h-11 mb-4 rounded-xl gradient-primary text-white hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/30 shrink-0 group"
          >
            <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
            <span>New Chat</span>
          </button>

          {/* Premium Search */}
          <label className="relative mb-4 block shrink-0">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces & conversations..."
              className="w-full h-10 rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary/50 transition-all duration-200 input-recessed"
            />
          </label>

          {/* Spaces List with Nested Conversations */}
          <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2">
            {filteredSpaces.map(renderSpaceItem)}
            
            {filteredSpaces.length === 0 && search && (
              <p className="px-3 py-4 text-sm text-text-secondary/60 text-center">
                No matching spaces or conversations
              </p>
            )}
          </div>

          {/* Settings at bottom */}
          <div className="pt-4 mt-3 border-t border-border shrink-0">
            <button
              onClick={onOpenSettings}
              className="w-full px-3 py-2.5 rounded-xl text-left ghost-hover flex items-center gap-3 transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-lg bg-surface-elevated/50 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-200">
                <Settings size={14} className="text-text-muted group-hover:text-primary transition-colors duration-200" />
              </div>
              <span className="text-sm text-text-secondary group-hover:text-text transition-colors duration-200">Settings</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Space Modals */}
      <SpaceFiles isOpen={filesPanelOpen} onClose={() => setFilesPanelOpen(false)} />
      <SpaceSettings isOpen={settingsPanelOpen} onClose={() => setSettingsPanelOpen(false)} />
      <TasksPanel isOpen={tasksPanelOpen} onClose={() => setTasksPanelOpen(false)} />
    </>
  );
};

export default Sidebar;
