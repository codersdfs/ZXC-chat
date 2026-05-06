import { useTheme } from "./components/ThemeProvider";
import ChatContainer from "./components/ChatContainer";
import Sidebar from "./components/Sidebar";
import SpaceView from "./components/space/SpaceView";
import { useState, useEffect } from "react";
import { Sun, Moon, Laptop2 } from "lucide-react";
import { useChatStore } from "./store/useChatStore";
import { useSpaceStore } from "./store/useSpaceStore";
import type { ChatSettings } from "../shared/types";

type ThemeMode = "light" | "dark" | "system";

const sectionTabs = [
  {
    key: "general",
    label: "General",
    helper:
      "Set default language, reading preferences, and high-contrast access for every response.",
  },
  {
    key: "provider",
    label: "AI Provider",
    helper:
      "Choose between local Ollama models or cloud-based OpenRouter free models.",
  },
  {
    key: "creativity",
    label: "Creativity & Style",
    helper:
      "Control how imaginative or precise the assistant sounds, and choose an overall tone.",
  },
  {
    key: "length",
    label: "Response Length",
    helper:
      "Choose how detailed responses should be, from quick summaries to very long explanations.",
  },
  {
    key: "structure",
    label: "Structure & Format",
    helper:
      "Configure response format preferences like bullets, step-by-step guidance, and examples.",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    helper:
      "Optimize output readability with font size, spacing, and simplified language settings.",
  },
];

const responseLengthOptions = [
  {
    value: "short",
    label: "Short",
    description: "Best for quick answers, definitions, and fast follow-ups.",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced responses with enough detail for most questions.",
  },
  {
    value: "long",
    label: "Long",
    description: "Great for walkthroughs, examples, and richer context.",
  },
  {
    value: "very-long",
    label: "Very Long",
    description: "Use for deep explanations, tutorials, and exhaustive analysis.",
  },
];

const languageOptions = ["English", "Spanish", "French", "German", "Chinese"];
const toneOptions = [
  "Balanced",
  "Formal",
  "Casual",
  "Enthusiastic",
  "Technical",
] as const;
const detailOptions = ["Concise", "Standard", "In-depth"] as const;
const fontSizeOptions = ["Small", "Medium", "Large", "Extra Large"] as const;
const lineSpacingOptions = ["Normal", "Wide", "Extra Wide"] as const;

const getDefaultSettings = (current: ChatSettings): ChatSettings => ({
  ...current,
  tone: "Balanced",
  defaultLanguage: "English",
  customStyleGuideEnabled: false,
  responseLengthPreset: "medium",
  bulletHeavyAnswers: false,
  stepByStep: false,
  includeExamples: false,
  detailLevel: "Standard",
  fontSizePreset: "Medium",
  lineSpacing: "Normal",
  simplifiedLanguageMode: false,
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("general");
  const { settings, setSettings, setHighContrast, textSize, highContrast, currentConversationId } =
    useChatStore();
  const { themeMode, setThemeMode } = useTheme();
  const { currentSpace } = useSpaceStore();
  const [draftSettings, setDraftSettings] = useState<ChatSettings>(
    getDefaultSettings(settings),
  );
  const [draftThemeMode, setDraftThemeMode] = useState<ThemeMode>(themeMode);

  // Determine which view to show:
  // - SpaceView when a space is selected but no conversation
  // - ChatContainer when a conversation is selected or no space selected
  const showSpaceView = currentSpace && !currentConversationId;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-text-size", textSize);
    root.setAttribute("data-high-contrast", highContrast.toString());
  }, [textSize, highContrast]);

  useEffect(() => {
    if (settingsOpen) {
      setDraftSettings(getDefaultSettings(settings));
      setDraftThemeMode(themeMode);
      setActiveSection("general");
    }
  }, [settingsOpen, settings, themeMode]);

  const updateDraft = (key: keyof ChatSettings, value: any) => {
    setDraftSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    setSettings(draftSettings);
    setThemeMode(draftThemeMode);
    setSettingsOpen(false);
  };

  const handleReset = () => {
    setDraftSettings(getDefaultSettings(draftSettings));
    setDraftThemeMode("system");
  };

  return (
    <>
      <div className="flex h-screen bg-bg text-text antialiased">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        {showSpaceView && currentSpace ? (
          <SpaceView
            space={currentSpace}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <ChatContainer
            onOpenSidebar={() => setSidebarOpen(true)}
            rightPanelOpen={rightPanelOpen}
            onToggleRightPanel={() => setRightPanelOpen((prev) => !prev)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
      </div>

      {settingsOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden bg-bg text-text">
          <div className="absolute inset-0 bg-gradient-to-br from-bg via-surface to-bg" />
          <div className="relative mx-auto flex h-full max-w-[1600px] overflow-hidden border-l border-border bg-surface shadow-2xl">
            <aside className="w-80 border-r border-border bg-surface p-8">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
                  Response Settings
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text">
                  AI Response Settings
                </h1>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  Organize response behavior, tone, and accessibility across every chat.
                </p>
              </div>

              <div className="space-y-2">
                {sectionTabs.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                      activeSection === section.key
                        ? "border-border bg-glass text-text shadow-sm"
                        : "border-transparent text-text-secondary hover:border-border hover:bg-glass"
                    }`}
                  >
                    <span className="font-medium">{section.label}</span>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      {section.helper}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-10">
              <div className="flex items-start justify-between gap-6 border-b border-border pb-6">
                <div>
                  <p className="text-sm text-text-secondary uppercase tracking-[0.3em]">
                    {sectionTabs.find((tab) => tab.key === activeSection)?.label}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-text">
                    {sectionTabs.find((tab) => tab.key === activeSection)?.label}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                    {sectionTabs.find((tab) => tab.key === activeSection)?.helper}
                  </p>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-sm transition hover:bg-glass"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 space-y-8">
                {activeSection === "general" && (
                  <div className="space-y-8">
                    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-text">General settings</h3>
                          <p className="mt-1 text-sm text-text-secondary">
                            Configure baseline reading and response defaults.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6 divide-y divide-border">
                        <div className="space-y-4 py-4">
                          <label className="block text-sm font-medium text-text">
                            Text size
                          </label>
                          <select
                            value={draftSettings.fontSizePreset}
                            onChange={(e) =>
                              updateDraft("fontSizePreset", e.target.value)
                            }
                            className="w-full max-w-sm rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {fontSizeOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-text">
                                Theme mode
                              </p>
                              <p className="mt-1 text-xs text-text-secondary">
                                Choose a light or dark appearance, or follow the system.
                              </p>
                            </div>
                            <span className="text-xs text-text-secondary">
                              Visual preference
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {([
                              {
                                value: "light",
                                label: "Light",
                                icon: <Sun size={16} />,
                              },
                              {
                                value: "dark",
                                label: "Dark",
                                icon: <Moon size={16} />,
                              },
                              {
                                value: "system",
                                label: "Follow system",
                                icon: <Laptop2 size={16} />,
                              },
                            ] as const).map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setDraftThemeMode(option.value)}
                                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                                  draftThemeMode === option.value
                                    ? "border-primary bg-primary/10 text-text"
                                    : "border-border bg-glass text-text-secondary hover:border-primary hover:text-text"
                                }`}
                              >
                                {option.icon}
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4 py-4">
                          <label className="flex items-center justify-between text-sm font-medium text-text">
                            <span>High contrast mode</span>
                            <span className="text-xs text-text-secondary">
                              Makes text and controls easier to scan
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setHighContrast(!highContrast)}
                            className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                              highContrast
                                ? "bg-primary text-white"
                                : "bg-glass text-text"
                            }`}
                          >
                            {highContrast ? "Enabled" : "Disabled"}
                          </button>
                        </div>

                        <div className="space-y-4 py-4">
                          <label className="block text-sm font-medium text-text">
                            Default language
                          </label>
                          <select
                            value={draftSettings.defaultLanguage}
                            onChange={(e) =>
                              updateDraft("defaultLanguage", e.target.value)
                            }
                            className="w-full max-w-sm rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {languageOptions.map((language) => (
                              <option key={language} value={language}>
                                {language}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeSection === "provider" && (
                  <div className="space-y-8">
                    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-text">
                          AI Provider
                        </h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          Choose between local Ollama models or cloud-based OpenRouter free models.
                        </p>
                      </div>

                      <div className="space-y-6 divide-y divide-border">
                        <div className="py-4">
                          <label className="block text-sm font-medium text-text mb-3">
                            Model Provider
                          </label>
                          <div className="flex flex-wrap gap-3">
                            {([
                              { value: "ollama", label: "Ollama (Local)", description: "Run models locally on your machine" },
                              { value: "openrouter", label: "OpenRouter (Cloud)", description: "Free cloud models via OpenRouter" },
                            ] as const).map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateDraft("modelProvider", option.value)}
                                className={`rounded-3xl border p-4 text-left transition min-w-[200px] ${
                                  draftSettings.modelProvider === option.value
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-border bg-glass hover:border-primary/30"
                                }`}
                              >
                                <p className="text-sm font-semibold text-text">
                                  {option.label}
                                </p>
                                <p className="mt-1 text-xs text-text-secondary">
                                  {option.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {draftSettings.modelProvider === "openrouter" && (
                          <div className="py-4">
                            <label className="block text-sm font-medium text-text mb-2">
                              OpenRouter API Key
                            </label>
                            <input
                              type="password"
                              value={draftSettings.searchApiKeys?.openRouter || ""}
                              onChange={(e) =>
                                updateDraft("searchApiKeys", {
                                  ...draftSettings.searchApiKeys,
                                  openRouter: e.target.value,
                                })
                              }
                              placeholder="sk-or-v1-..."
                              className="w-full max-w-md rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                            <p className="mt-2 text-xs text-text-secondary">
                              Get your free API key from{" "}
                              <a
                                href="https://openrouter.ai/keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                openrouter.ai/keys
                              </a>
                              . Free tier includes generous rate limits.
                            </p>
                          </div>
                        )}

                        {draftSettings.modelProvider === "ollama" && (
                          <div className="py-4">
                            <div className="rounded-3xl border border-border bg-glass p-4">
                              <p className="text-sm font-medium text-text mb-2">
                                Ollama Status
                              </p>
                              <p className="text-sm text-text-secondary">
                                Make sure Ollama is installed and running on your machine.
                                <br />
                                <a
                                  href="https://ollama.ai"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Download Ollama
                                </a>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeSection === "creativity" && (
                  <div className="space-y-8">
                    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                      <div className="mb-5">
                        <h3 className="text-lg font-semibold text-text">
                          Creativity & style
                        </h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          Adjust how imaginative or precise the assistant sounds.
                        </p>
                      </div>

                      <div className="space-y-6 divide-y divide-border">
                        <div className="py-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-medium text-text">
                                Creativity slider
                              </p>
                              <p className="mt-1 text-sm text-text-secondary">
                                Lower values for precise responses, higher values for imaginative output.
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-text">
                              {draftSettings.temperature?.toFixed(1)}
                            </span>
                          </div>
                          <div className="mt-5">
                            <input
                              type="range"
                              min={0}
                              max={1}
                              step={0.05}
                              value={draftSettings.temperature ?? 0.7}
                              onChange={(e) =>
                                updateDraft("temperature", Number(e.target.value))
                              }
                              className="w-full"
                            />
                            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                              <span>Precise</span>
                              <span>Imaginative</span>
                            </div>
                          </div>
                        </div>

                        <div className="py-4">
                          <label className="block text-sm font-medium text-text">
                            Tone
                          </label>
                          <select
                            value={draftSettings.tone}
                            onChange={(e) => updateDraft("tone", e.target.value)}
                            className="w-full max-w-sm rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          >
                            {toneOptions.map((tone) => (
                              <option key={tone} value={tone}>
                                {tone}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="py-4">
                          <label className="flex items-center justify-between text-sm font-medium text-text">
                            <span>Use my custom style guide</span>
                            <button
                              type="button"
                              onClick={() =>
                                updateDraft(
                                  "customStyleGuideEnabled",
                                  !draftSettings.customStyleGuideEnabled,
                                )
                              }
                              className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                                draftSettings.customStyleGuideEnabled
                                  ? "bg-primary text-white"
                                  : "bg-glass text-text"
                              }`}
                            >
                              {draftSettings.customStyleGuideEnabled
                                ? "Enabled"
                                : "Disabled"}
                            </button>
                          </label>
                          <p className="mt-2 text-sm text-text-secondary">
                            When enabled, responses will align more closely with your custom style preferences.
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeSection === "length" && (
                  <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-text">
                        Response length
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        Pick a length profile for typical answers and explanations.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {responseLengthOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateDraft("responseLengthPreset", option.value)
                          }
                          className={`rounded-3xl border p-5 text-left transition ${
                            draftSettings.responseLengthPreset === option.value
                              ? "border-border bg-glass shadow-sm"
                              : "border-border bg-surface hover:border-primary/20"
                          }`}
                        >
                          <p className="text-sm font-semibold text-text">
                            {option.label}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-text-secondary">
                            {option.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {activeSection === "structure" && (
                  <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-text">
                        Structure & format
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        Choose how answers are organized and how much detail they include.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <label className="flex items-center justify-between rounded-3xl border border-border bg-glass px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-text">
                            Bullet-heavy answers
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            Prefer lists and sections for easy scanning.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(
                              "bulletHeavyAnswers",
                              !draftSettings.bulletHeavyAnswers,
                            )
                          }
                          className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                            draftSettings.bulletHeavyAnswers
                              ? "bg-primary text-white"
                              : "bg-glass text-text"
                          }`}
                        >
                          {draftSettings.bulletHeavyAnswers ? "On" : "Off"}
                        </button>
                      </label>

                      <label className="flex items-center justify-between rounded-3xl border border-border bg-glass px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-text">
                            Step-by-step mode
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            Encourage the assistant to break down solutions into steps.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft("stepByStep", !draftSettings.stepByStep)
                          }
                          className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                            draftSettings.stepByStep
                              ? "bg-primary text-white"
                              : "bg-glass text-text"
                          }`}
                        >
                          {draftSettings.stepByStep ? "On" : "Off"}
                        </button>
                      </label>

                      <label className="flex items-center justify-between rounded-3xl border border-border bg-glass px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-text">
                            Include examples by default
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            Automatically add illustrative examples when possible.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(
                              "includeExamples",
                              !draftSettings.includeExamples,
                            )
                          }
                          className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                            draftSettings.includeExamples
                              ? "bg-primary text-white"
                              : "bg-glass text-text"
                          }`}
                        >
                          {draftSettings.includeExamples ? "On" : "Off"}
                        </button>
                      </label>

                      <div className="rounded-3xl border border-border bg-glass p-4">
                        <p className="text-sm font-medium text-text">
                          Preferred level of detail
                        </p>
                        <select
                          value={draftSettings.detailLevel}
                          onChange={(e) => updateDraft("detailLevel", e.target.value)}
                          className="mt-3 w-full rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {detailOptions.map((detail) => (
                            <option key={detail} value={detail}>
                              {detail}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>
                )}

                {activeSection === "accessibility" && (
                  <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-text">
                        Accessibility
                      </h3>
                      <p className="mt-1 text-sm text-text-secondary">
                        Improve readability and clarity for every response.
                      </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-3xl border border-border bg-glass p-5">
                        <p className="text-sm font-medium text-text">
                          Font size preset
                        </p>
                        <select
                          value={draftSettings.fontSizePreset}
                          onChange={(e) =>
                            updateDraft("fontSizePreset", e.target.value)
                          }
                          className="mt-4 w-full rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {fontSizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-3xl border border-border bg-glass p-5">
                        <p className="text-sm font-medium text-text">
                          Line spacing
                        </p>
                        <select
                          value={draftSettings.lineSpacing}
                          onChange={(e) =>
                            updateDraft("lineSpacing", e.target.value)
                          }
                          className="mt-4 w-full rounded-2xl border border-border bg-glass px-4 py-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {lineSpacingOptions.map((spacing) => (
                            <option key={spacing} value={spacing}>
                              {spacing}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <label className="flex items-center justify-between rounded-3xl border border-border bg-glass px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-text">
                            High contrast mode
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            Mirror general contrast controls for quick access.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHighContrast(!highContrast)}
                          className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                            highContrast
                              ? "bg-primary text-white"
                              : "bg-glass text-text"
                          }`}
                        >
                          {highContrast ? "Enabled" : "Disabled"}
                        </button>
                      </label>

                      <label className="flex items-center justify-between rounded-3xl border border-border bg-glass px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-text">
                            Simplified language mode
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            Make responses easier to understand on first read.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft(
                              "simplifiedLanguageMode",
                              !draftSettings.simplifiedLanguageMode,
                            )
                          }
                          className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold transition ${
                            draftSettings.simplifiedLanguageMode
                              ? "bg-primary text-white"
                              : "bg-glass text-text"
                          }`}
                        >
                          {draftSettings.simplifiedLanguageMode ? "On" : "Off"}
                        </button>
                      </label>
                    </div>
                  </section>
                )}
              </div>
            </main>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-gradient-to-t from-surface to-transparent" />
            <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
            <div className="absolute right-8 bottom-8 flex items-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition hover:bg-glass"
              >
                Reset to defaults
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition hover:bg-glass"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
