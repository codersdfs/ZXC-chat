/**
 * Custom hook for managing Spaces state
 */
import { useState, useCallback, useMemo } from 'react';
import type { Space, ChatTab, ChatMessage, Persona, WorkflowCategory } from '../types/space';
import { generateId, formatLastActive } from '../types/space';

// Default personas
const defaultPersonas: Persona[] = [
  {
    id: 'assistant',
    name: 'Assistant',
    description: 'General AI assistant',
    icon: '🤖',
    systemPrompt: 'You are a helpful AI assistant.'
  },
  {
    id: 'coder',
    name: 'Coding Expert',
    description: 'Expert software developer',
    icon: '💻',
    systemPrompt: 'You are an expert software engineer. Write clean, maintainable code with comprehensive comments and error handling.'
  },
  {
    id: 'writer',
    name: 'Creative Writer',
    description: 'Creative writing assistant',
    icon: '✍️',
    systemPrompt: 'You are a creative writing assistant. Help with storytelling, character development, and world-building.'
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Data analysis specialist',
    icon: '📊',
    systemPrompt: 'You are a data scientist. Analyze data thoroughly, create visualizations, and provide actionable insights.'
  }
];

// Default workflow categories
const defaultCategories: WorkflowCategory[] = [
  { id: 'all', name: 'All Spaces', icon: '📁', spaceIds: [] },
  { id: 'coding', name: 'Coding', icon: '💻', spaceIds: [] },
  { id: 'writing', name: 'Writing', icon: '✍️', spaceIds: [] },
  { id: 'analysis', name: 'Analysis', icon: '📊', spaceIds: [] },
  { id: 'learning', name: 'Learning', icon: '📚', spaceIds: [] }
];

// Initial demo spaces
const initialSpaces: Space[] = [
  {
    id: '1',
    name: 'AI Coding Agent',
    customInstructions: 'You are an expert software engineer. Write clean, maintainable code with comprehensive comments and error handling.',
    lastActive: Date.now() - 2 * 86400000,
    createdAt: Date.now() - 2 * 86400000
  },
  {
    id: '2',
    name: 'Creative Writing',
    customInstructions: 'You are a creative writing assistant. Help with storytelling, character development, and world-building.',
    lastActive: Date.now() - 12 * 86400000,
    createdAt: Date.now() - 12 * 86400000
  },
  {
    id: '3',
    name: 'Data Analysis',
    customInstructions: 'You are a data scientist. Analyze data thoroughly, create visualizations, and provide actionable insights.',
    lastActive: Date.now() - 19 * 86400000,
    createdAt: Date.now() - 19 * 86400000
  },
  {
    id: '4',
    name: 'Learning Korean',
    customInstructions: 'You are a friendly Korean language teacher. Help with grammar, vocabulary, and pronunciation.',
    lastActive: Date.now() - 3 * 3600000,
    createdAt: Date.now() - 3 * 3600000
  },
  {
    id: '5',
    name: 'DevOps Assistant',
    customInstructions: 'You are a DevOps specialist. Help with CI/CD pipelines, infrastructure, and cloud deployments.',
    lastActive: Date.now() - 5 * 86400000,
    createdAt: Date.now() - 5 * 86400000
  }
];

interface UseSpacesReturn {
  // Spaces
  spaces: Space[];
  filteredSpaces: Space[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  createSpace: (name: string, customInstructions: string) => void;
  deleteSpace: (id: string) => void;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  
  // Categories
  categories: WorkflowCategory[];
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  
  // Tabs
  tabs: ChatTab[];
  activeTab: string | null;
  openTab: (spaceId: string, title?: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  
  // Messages
  sendMessage: (tabId: string, content: string) => void;
  getMessages: (tabId: string) => ChatMessage[];
  
  // Personas
  personas: Persona[];
  selectedPersona: Persona;
  setSelectedPersona: (personaId: string) => void;
  
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  
  // Modal states
  showNewSpaceModal: boolean;
  setShowNewSpaceModal: (show: boolean) => void;
}

export function useSpaces(): UseSpacesReturn {
  // Spaces state
  const [spaces, setSpaces] = useState<Space[]>(initialSpaces);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
  
  // Category state
  const [categories] = useState<WorkflowCategory[]>(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Tabs state
  const [tabs, setTabs] = useState<ChatTab[]>([]);
  const [activeTab, setActiveTabState] = useState<string | null>(null);
  
  // Messages state
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  
  // Persona state
  const [personas] = useState<Persona[]>(defaultPersonas);
  const [selectedPersonaId, setSelectedPersonaId] = useState('assistant');
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Filter spaces by search and category
  const filteredSpaces = useMemo(() => {
    let filtered = spaces;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.customInstructions.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.id === selectedCategory);
      if (category) {
        filtered = filtered.filter(s => category.spaceIds.includes(s.id));
      }
    }
    
    return filtered;
  }, [spaces, searchQuery, selectedCategory, categories]);

  // Get selected persona
  const selectedPersona = personas.find(p => p.id === selectedPersonaId) || personas[0];

  // Create a new space
  const createSpace = useCallback((name: string, customInstructions: string) => {
    const space: Space = {
      id: generateId(),
      name: name.trim(),
      customInstructions: customInstructions.trim(),
      lastActive: Date.now(),
      createdAt: Date.now()
    };
    setSpaces(prev => [space, ...prev]);
    setShowNewSpaceModal(false);
  }, []);

  // Delete a space
  const deleteSpace = useCallback((id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    // Also close any tabs associated with this space
    setTabs(prev => {
      const tabsToClose = prev.filter(t => t.spaceId === id);
      tabsToClose.forEach(t => {
        delete messages[t.id];
      });
      return prev.filter(t => t.spaceId !== id);
    });
    if (activeTab && tabs.filter(t => t.spaceId === id).some(t => t.id === activeTab)) {
      const remainingTabs = tabs.filter(t => t.spaceId !== id);
      setActiveTabState(remainingTabs.length > 0 ? remainingTabs[0].id : null);
    }
  }, [activeTab, tabs, messages]);

  // Update a space
  const updateSpace = useCallback((id: string, updates: Partial<Space>) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Open a tab for a space
  const openTab = useCallback((spaceId: string, title?: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    // Check if tab already exists
    const existingTab = tabs.find(t => t.spaceId === spaceId);
    if (existingTab) {
      setActiveTabState(existingTab.id);
      // Update tabs to set this as active
      setTabs(prev => prev.map(t => ({
        ...t,
        isActive: t.id === existingTab.id
      })));
      return;
    }

    const newTab: ChatTab = {
      id: generateId(),
      title: title || space.name,
      spaceId: space.id,
      messages: [],
      createdAt: Date.now(),
      isActive: true
    };

    setTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
    setActiveTabState(newTab.id);
    setMessages(prev => ({ ...prev, [newTab.id]: [] }));
  }, [spaces, tabs]);

  // Close a tab
  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      // If closing active tab, activate another
      if (tabId === activeTab && newTabs.length > 0) {
        const newIndex = Math.min(
          prev.findIndex(t => t.id === tabId),
          newTabs.length - 1
        );
        setActiveTabState(newTabs[newIndex].id);
        setTabs(prev => prev.map(t => ({
          ...t,
          isActive: t.id === newTabs[newIndex].id
        })));
      } else if (newTabs.length === 0) {
        setActiveTabState(null);
      }
      return newTabs;
    });
    // Clean up messages
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[tabId];
      return newMessages;
    });
  }, [activeTab]);

  // Set active tab
  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabState(tabId);
    setTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === tabId
    })));
  }, []);

  // Send a message
  const sendMessage = useCallback((tabId: string, content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => ({
      ...prev,
      [tabId]: [...(prev[tabId] || []), userMessage]
    }));

    // Simulate AI response
    setTimeout(() => {
      const tab = tabs.find(t => t.id === tabId);
      if (!tab) return;
      
      const space = spaces.find(s => s.id === tab.spaceId);
      const instructions = space?.customInstructions || '';
      
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: generateResponse(content, instructions, selectedPersona),
        timestamp: Date.now()
      };

      setMessages(prev => ({
        ...prev,
        [tabId]: [...(prev[tabId] || []), assistantMessage]
      }));

      // Update space last active
      if (space) {
        updateSpace(space.id, { lastActive: Date.now() });
      }
    }, 1000);
  }, [tabs, spaces, selectedPersona, updateSpace]);

  // Get messages for a tab
  const getMessages = useCallback((tabId: string): ChatMessage[] => {
    return messages[tabId] || [];
  }, [messages]);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Apply dark mode class to document
  useMemo(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
  }, [isDarkMode]);

  return {
    spaces,
    filteredSpaces,
    searchQuery,
    setSearchQuery,
    createSpace,
    deleteSpace,
    updateSpace,
    categories,
    selectedCategory,
    setSelectedCategory,
    tabs,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
    sendMessage,
    getMessages,
    personas,
    selectedPersona,
    setSelectedPersona: setSelectedPersonaId,
    isDarkMode,
    toggleDarkMode,
    showNewSpaceModal,
    setShowNewSpaceModal
  };
}

// Simple response generator (simulates AI)
function generateResponse(userMessage: string, instructions: string, persona: Persona): string {
  const responses = [
    `Based on your request about "${userMessage.slice(0, 30)}...", let me help you with that.`,
    `That's an interesting question! Here's my perspective as ${persona.name}: ${userMessage.slice(0, 50)}...`,
    `I understand you're asking about "${userMessage.slice(0, 30)}". Let me provide some insights.`,
    `Great question! Considering my role as ${persona.name}, here's what I think...`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)] + 
    '\n\n' + 
    `[Instructions: ${instructions.slice(0, 100)}${instructions.length > 100 ? '...' : ''}]`;
}