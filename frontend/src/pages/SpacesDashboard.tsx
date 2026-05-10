/**
 * SpacesDashboard page
 * Main page for managing AI workflow spaces with chat interface
 */
import React from 'react';
import { useSpaces } from '../hooks/useSpaces';
import { Sidebar } from '../components/spaces/Sidebar';
import { TopNavigation } from '../components/chat/TopNavigation';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageInput } from '../components/chat/MessageInput';
import { NewSpaceModal } from '../components/spaces/NewSpaceModal';
import styles from './SpacesDashboard.module.css';

export default function SpacesDashboard() {
  const {
    // Spaces
    spaces,
    filteredSpaces,
    searchQuery,
    setSearchQuery,
    createSpace,
    deleteSpace,
    
    // Categories
    categories,
    selectedCategory,
    setSelectedCategory,
    
    // Tabs
    tabs,
    activeTab,
    openTab,
    closeTab,
    setActiveTab,
    
    // Messages
    sendMessage,
    getMessages,
    
    // Personas
    personas,
    selectedPersona,
    setSelectedPersona,
    
    // Theme
    isDarkMode,
    toggleDarkMode,
    
    // Modal
    showNewSpaceModal,
    setShowNewSpaceModal
  } = useSpaces();

  // Get active tab messages
  const activeMessages = activeTab ? getMessages(activeTab) : [];

  // Handle opening a space (creates a new tab)
  const handleOpenSpace = (spaceId: string) => {
    openTab(spaceId);
  };

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (activeTab) {
      sendMessage(activeTab, content);
    }
  };

  return (
    <div className={`${styles.dashboard} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
      {/* Top Navigation */}
      <TopNavigation
        personas={personas}
        selectedPersona={selectedPersona}
        onPersonaChange={setSelectedPersona}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleDarkMode}
        userName="User"
      />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <Sidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          spaces={spaces}
          filteredSpaces={filteredSpaces}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSpace={handleOpenSpace}
          onCreateSpace={() => setShowNewSpaceModal(true)}
        />

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {/* Chat Window */}
          <ChatWindow
            tabs={tabs}
            activeTab={activeTab}
            spaces={spaces}
            messages={activeMessages}
            onActivateTab={setActiveTab}
            onCloseTab={closeTab}
            isDarkMode={isDarkMode}
          />

          {/* Message Input */}
          {activeTab && (
            <div className={styles.inputContainer}>
              <MessageInput
                onSend={handleSendMessage}
                disabled={!activeTab}
                placeholder="Type your message..."
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Space Modal */}
      <NewSpaceModal
        isOpen={showNewSpaceModal}
        onClose={() => setShowNewSpaceModal(false)}
        onCreate={createSpace}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}