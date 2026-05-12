import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  Trash2,
  Search,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileImage,
  File,
  Download,
  Eye,
} from "lucide-react";
import { useSpaceStore } from "../store/useSpaceStore";
import type { SpaceFile } from "../../shared/types";
import SpaceIcon from "./icons/SpaceIcon";

interface SpaceFilesProps {
  isOpen: boolean;
  onClose: () => void;
}

const getFileIcon = (type: string) => {
  if (type.includes("code") || type.includes("javascript") || type.includes("typescript"))
    return <FileCode size={20} className="text-blue-400" />;
  if (type.includes("json")) return <FileJson size={20} className="text-yellow-400" />;
  if (type.includes("sheet") || type.includes("csv") || type.includes("excel"))
    return <FileSpreadsheet size={20} className="text-green-400" />;
  if (type.includes("image")) return <FileImage size={20} className="text-purple-400" />;
  if (type.includes("text") || type.includes("markdown"))
    return <FileText size={20} className="text-primary" />;
  return <File size={20} className="text-text-muted" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const SpaceFiles = ({ isOpen, onClose }: SpaceFilesProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingFile, setViewingFile] = useState<SpaceFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentSpace, currentSpaceId, addFile, removeFile, getSpaceFiles } = useSpaceStore();

  const files = currentSpaceId ? getSpaceFiles(currentSpaceId) : [];

  const filteredFiles = files.filter(
    (file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = useCallback(
    async (uploadedFiles: FileList | null) => {
      if (!uploadedFiles || !currentSpaceId) return;

      for (const file of Array.from(uploadedFiles)) {
        try {
          const content = await file.text();
          addFile(currentSpaceId, {
            name: file.name,
            type: file.type || "application/octet-stream",
            content,
            size: file.size,
          });
        } catch (error) {
          console.error("Error reading file:", error);
        }
      }
    },
    [currentSpaceId, addFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  if (!isOpen || !currentSpace) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: currentSpace.color || "#6366F1" }}
            >
              <SpaceIcon icon={currentSpace.icon} size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">{currentSpace.name}</h2>
              <p className="text-sm text-text-muted">
                {files.length} file{files.length !== 1 ? "s" : ""} · Space Files
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

        {/* Search and Upload */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            multiple
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Upload size={16} />
            Upload
          </button>
        </div>

        {/* File List */}
        <div
          className={`flex-1 overflow-y-auto p-6 ${
            isDragging ? "bg-primary/5 border-2 border-dashed border-primary" : ""
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated/50 flex items-center justify-center mb-4">
                <Upload size={24} className="text-text-muted" />
              </div>
              <h3 className="text-sm font-medium text-text mb-1">
                {searchQuery ? "No files found" : "No files yet"}
              </h3>
              <p className="text-sm text-text-muted max-w-xs">
                {searchQuery
                  ? "Try a different search term"
                  : "Upload files to add them to this space. They'll be searchable and available for context."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-elevated/50 transition-colors"
                >
                  Upload your first file
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{file.name}</p>
                    <p className="text-xs text-text-muted">
                      {formatFileSize(file.size)} · {file.type.split("/").pop()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setViewingFile(file)}
                      className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-primary transition-colors"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([file.content], { type: file.type });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = file.name;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-primary transition-colors"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => currentSpaceId && removeFile(currentSpaceId, file.id)}
                      className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-elevated/20">
          <p className="text-xs text-text-muted text-center">
            Files uploaded to this space are used for context when answering questions
          </p>
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl max-h-[80vh] bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                {getFileIcon(viewingFile.type)}
                <div>
                  <h3 className="text-base font-medium text-text">{viewingFile.name}</h3>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(viewingFile.size)} · {viewingFile.type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingFile(null)}
                className="p-2 rounded-lg hover:bg-surface-elevated/50 transition-colors text-text-muted hover:text-text"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-surface-elevated/20">
              <pre className="text-sm text-text font-mono whitespace-pre-wrap break-all">
                {viewingFile.content.slice(0, 10000)}
                {viewingFile.content.length > 10000 && (
                  <span className="text-text-muted">
                    {"\n\n"}... (file truncated, {viewingFile.content.length - 10000} more characters)
                  </span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceFiles;
