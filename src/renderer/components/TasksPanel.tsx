import { useState } from "react";
import {
  X,
  Plus,
  Clock,
  Calendar,
  Play,
  Pause,
  Trash2,
  Check,
  RotateCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSpaceStore } from "../store/useSpaceStore";
import type { SpaceTask } from "../../shared/types";

interface TasksPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SCHEDULE_OPTIONS = [
  { value: "once", label: "Run once", description: "Execute a single time" },
  { value: "hourly", label: "Hourly", description: "Run every hour" },
  { value: "daily", label: "Daily", description: "Run every day" },
  { value: "weekly", label: "Weekly", description: "Run every week" },
  { value: "monthly", label: "Monthly", description: "Run every month" },
];

const TasksPanel = ({ isOpen, onClose }: TasksPanelProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Form state
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPrompt, setTaskPrompt] = useState("");
  const [taskSchedule, setTaskSchedule] = useState<SpaceTask["schedule"]>("daily");

  const { currentSpace, currentSpaceId, addTask, removeTask, updateTask, runTask, getSpaceTasks } =
    useSpaceStore();

  const tasks = currentSpaceId ? getSpaceTasks(currentSpaceId) : [];

  const activeTasks = tasks.filter((t) => t.isActive);
  const inactiveTasks = tasks.filter((t) => !t.isActive);

  const handleCreateTask = () => {
    if (!currentSpaceId || !taskName.trim() || !taskPrompt.trim()) return;

    const now = new Date();
    let nextRun = new Date(now);

    // Calculate next run based on schedule
    switch (taskSchedule) {
      case "hourly":
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case "daily":
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case "weekly":
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case "monthly":
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case "once":
        nextRun = now;
        break;
    }

    addTask(currentSpaceId, {
      name: taskName,
      description: taskDescription || undefined,
      prompt: taskPrompt,
      schedule: taskSchedule,
      nextRunAt: nextRun,
      isActive: true,
    });

    resetForm();
    setIsCreating(false);
  };

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setTaskPrompt("");
    setTaskSchedule("daily");
  };

  const handleToggleTask = (task: SpaceTask) => {
    if (!currentSpaceId) return;
    updateTask(currentSpaceId, task.id, { isActive: !task.isActive });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!currentSpaceId) return;
    if (confirm("Are you sure you want to delete this task?")) {
      removeTask(currentSpaceId, taskId);
    }
  };

  const formatSchedule = (schedule: SpaceTask["schedule"]) => {
    const option = SCHEDULE_OPTIONS.find((o) => o.value === schedule);
    return option?.label || schedule;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (task: SpaceTask) => {
    return task.isActive && new Date(task.nextRunAt) < new Date();
  };

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
              <Clock size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Scheduled Tasks</h2>
              <p className="text-sm text-text-muted">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {activeTasks.length} active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="h-9 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Plus size={16} />
                New Task
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-elevated/50 transition-colors text-text-muted hover:text-text"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Create Task Form */}
        {isCreating && (
          <div className="p-6 border-b border-border bg-surface-elevated/20">
            <h3 className="text-sm font-medium text-text mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Task Name
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="e.g., Daily Summary"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Schedule
                  </label>
                  <select
                    value={taskSchedule}
                    onChange={(e) => setTaskSchedule(e.target.value as SpaceTask["schedule"])}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                  >
                    {SCHEDULE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="What does this task do?"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  AI Prompt
                </label>
                <textarea
                  value={taskPrompt}
                  onChange={(e) => setTaskPrompt(e.target.value)}
                  rows={3}
                  placeholder="Enter the prompt to send to the AI when this task runs..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:border-primary/50 resize-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  This prompt will be sent automatically on schedule
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    resetForm();
                    setIsCreating(false);
                  }}
                  className="h-9 px-4 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-elevated/50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!taskName.trim() || !taskPrompt.trim()}
                  className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated/50 flex items-center justify-center mb-4">
                <Clock size={24} className="text-text-muted" />
              </div>
              <h3 className="text-sm font-medium text-text mb-1">No tasks yet</h3>
              <p className="text-sm text-text-muted max-w-xs">
                Create scheduled tasks to automate prompts and get regular updates from the AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Tasks */}
              {activeTasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Active Tasks
                  </h4>
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isOverdue(task)
                            ? "border-error/30 bg-error/5"
                            : "border-border bg-surface-elevated/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className={`p-2 rounded-lg transition-colors ${
                              task.isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-surface-elevated text-text-muted"
                            }`}
                          >
                            {task.isActive ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-text">{task.name}</h4>
                              {isOverdue(task) && (
                                <span className="text-xs text-error flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Overdue
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <RotateCw size={12} />
                                {formatSchedule(task.schedule)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Next: {formatDate(task.nextRunAt)}
                              </span>
                              {task.lastRunAt && (
                                <span className="flex items-center gap-1">
                                  <Check size={12} />
                                  Last: {formatDate(task.lastRunAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setExpandedTask(expandedTask === task.id ? null : task.id)
                              }
                              className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted transition-colors"
                            >
                              {expandedTask === task.id ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => currentSpaceId && runTask(currentSpaceId, task.id)}
                              className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                              title="Run now"
                            >
                              <Play size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {expandedTask === task.id && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs font-medium text-text-muted mb-1.5">Prompt:</p>
                            <pre className="text-xs text-text font-mono bg-surface-elevated/50 p-3 rounded-lg whitespace-pre-wrap">
                              {task.prompt}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Tasks */}
              {inactiveTasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                    Paused Tasks
                  </h4>
                  <div className="space-y-2">
                    {inactiveTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 rounded-xl border border-border bg-surface-elevated/20 opacity-60"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTask(task)}
                            className="p-2 rounded-lg bg-surface-elevated text-text-muted"
                          >
                            <Play size={16} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-text line-through">
                              {task.name}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                              <span>{formatSchedule(task.schedule)}</span>
                              {task.lastRunAt && (
                                <span>Last run: {formatDate(task.lastRunAt)}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 rounded-lg hover:bg-error/10 text-error transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-elevated/20">
          <p className="text-xs text-text-muted text-center">
            Tasks automatically send prompts to the AI on their schedule
          </p>
        </div>
      </div>
    </div>
  );
};

export default TasksPanel;
