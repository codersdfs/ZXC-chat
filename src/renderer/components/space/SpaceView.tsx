/**
 * SpaceView Component
 * Main layout matching the reference design:
 * - Left sidebar: Threads list + chat input
 * - Center: Task/thread content area
 * - Right sidebar: Space configuration (instructions, files, links)
 */

import { useState } from "react";
import {
  ChevronDown,
  Plus,
  Mic,
  FileText,
  Link as LinkIcon,
  Sparkles,
  MoreHorizontal,
  Search,
  Settings,
  Users,
  FolderOpen,
  Send,
} from "lucide-react";
import { useSpaceStore } from "../../store/useSpaceStore";
import { useChatStore } from "../../store/useChatStore";
import type { Space } from "../../../shared/types";
import SpaceIcon from "../icons/SpaceIcon";

// ============================================================================
// Types
// ============================================================================

interface SpaceViewProps {
  space: Space;
  onOpenSettings: () => void;
}


// ============================================================================
// Main Component
// ============================================================================

const SpaceView = ({
  space,
  onOpenSettings,
}: SpaceViewProps) => {
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);
  const [filesExpanded, setFilesExpanded] = useState(true);
  const [linksExpanded, setLinksExpanded] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const { getSpaceFiles, currentSpaceId, spaces } = useSpaceStore();
  const { createConversation, setCurrentConversation } = useChatStore();
  const files = currentSpaceId ? getSpaceFiles(currentSpaceId) : [];

  // Get the full space data from store to ensure we have latest
  const fullSpace = spaces.find(s => s.id === space.id) || space;

  return (
    <div className="flex h-full bg-[#1a1a1a] text-gray-100 overflow-hidden">
      {/* ============================================================================
          LEFT SIDEBAR - Threads & Chat Input
          ============================================================================ */}
      <aside className="w-80 flex flex-col border-r border-gray-800 bg-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Threads</h2>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400">
              <Search size={16} />
            </button>
            <button className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Space Selector */}
        <div className="px-3 py-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 text-sm text-gray-300 transition-colors">
            <FolderOpen size={16} className="text-gray-400" />
            <span className="flex-1 text-left">Shared in space</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto px-3">
          {/* TODO: Map actual threads */}
          <div className="text-center py-8 text-gray-500 text-sm">
            No threads yet
          </div>
        </div>

        {/* Chat Input Area */}
        <div className="p-3 border-t border-gray-800">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {/* Input */}
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Start a task in ${fullSpace.name}`}
              rows={3}
              className="w-full px-3 py-2.5 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && chatInput.trim()) {
                  e.preventDefault();
                  // Create new conversation and navigate to chat
                  const convId = createConversation(chatInput.slice(0, 50));
                  if (currentSpaceId) {
                    useSpaceStore.getState().linkConversation(currentSpaceId, convId);
                  }
                  setCurrentConversation(convId);
                }
              }}
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                {/* Add Attachment */}
                <button className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 transition-colors">
                  <Plus size={16} />
                </button>

                {/* Model Selector */}
                <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-800 text-gray-400 text-xs transition-colors">
                  <span className="text-gray-300">Computer</span>
                  <Plus size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                {/* Model Dropdown */}
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-800 text-gray-400 text-xs transition-colors">
                  <span>Model</span>
                  <ChevronDown size={12} />
                </button>

                {/* Mic / Send */}
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      // Create new conversation and navigate to chat
                      const convId = createConversation(chatInput.slice(0, 50));
                      if (currentSpaceId) {
                        useSpaceStore.getState().linkConversation(currentSpaceId, convId);
                      }
                      setCurrentConversation(convId);
                    } else {
                      setIsRecording(!isRecording);
                    }
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isRecording
                      ? "bg-red-500/20 text-red-400 animate-pulse"
                      : chatInput.trim()
                      ? "bg-white text-gray-900 hover:bg-gray-100"
                      : "hover:bg-gray-800 text-gray-400"
                  }`}
                >
                  {chatInput.trim() ? (
                    <Send size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================================
          CENTER - Content Area
          ============================================================================ */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#1a1a1a]">
        {/* Space Header */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: fullSpace.color || "#6366F1" }}
            >
              <SpaceIcon icon={fullSpace.icon} size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-100">{fullSpace.name}</h1>
              {fullSpace.description && (
                <p className="text-sm text-gray-500">{fullSpace.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No tasks yet</p>
        </div>
      </main>

      {/* ============================================================================
          RIGHT SIDEBAR - Space Configuration
          ============================================================================ */}
      <aside className="w-72 flex flex-col border-l border-gray-800 bg-[#1a1a1a]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Space Instructions */}
          <ConfigSection
            title="Space instructions"
            description="Give Computer instructions for how it should work in this space."
            icon={<Sparkles size={16} className="text-purple-400" />}
            actionLabel="Add instructions..."
            isExpanded={instructionsExpanded}
            onToggle={() => setInstructionsExpanded(!instructionsExpanded)}
            onAction={() => {
              /* Open instructions editor */
            }}
          >
            {fullSpace.customInstructions && (
              <div className="mt-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className="text-xs text-gray-300 line-clamp-3">
                  {fullSpace.customInstructions}
                </p>
              </div>
            )}
          </ConfigSection>

          {/* Files */}
          <ConfigSection
            title="Files"
            description="Add reference docs, data, or files that Computer should use as context. You can ask Computer to upload or edit files in this space."
            icon={<FileText size={16} className="text-blue-400" />}
            actionLabel="Add files..."
            isExpanded={filesExpanded}
            onToggle={() => setFilesExpanded(!filesExpanded)}
            onAction={() => {
              /* Open file upload */
            }}
          >
            {files.length > 0 && (
              <div className="mt-3 space-y-1">
                {files.slice(0, 3).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-gray-800/50 text-xs text-gray-300"
                  >
                    <FileText size={12} className="text-gray-400" />
                    <span className="flex-1 truncate">{file.name}</span>
                  </div>
                ))}
                {files.length > 3 && (
                  <p className="text-xs text-gray-500 px-2">
                    +{files.length - 3} more files
                  </p>
                )}
              </div>
            )}
          </ConfigSection>

          {/* Links */}
          <ConfigSection
            title="Links"
            description="Add websites that Computer should prioritize when running tasks."
            icon={<LinkIcon size={16} className="text-green-400" />}
            actionLabel="Paste a website URL"
            isExpanded={linksExpanded}
            onToggle={() => setLinksExpanded(!linksExpanded)}
            onAction={() => {
              /* Open link input */
            }}
          >
            {/* TODO: Show linked URLs */}
          </ConfigSection>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 text-sm transition-colors"
          >
            <Settings size={16} />
            <span>Space settings</span>
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-400 text-sm transition-colors">
            <Users size={16} />
            <span>Share space</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

// ============================================================================
// Config Section Component
// ============================================================================

interface ConfigSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: () => void;
  children?: React.ReactNode;
}

const ConfigSection = ({
  title,
  description,
  icon,
  actionLabel,
  isExpanded,
  onToggle,
  onAction,
  children,
}: ConfigSectionProps) => {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-medium text-gray-200">{title}</h3>
          {isExpanded && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-500 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {children}
          <button
            onClick={onAction}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 text-gray-400 text-sm transition-colors"
          >
            <Plus size={14} />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceView;
