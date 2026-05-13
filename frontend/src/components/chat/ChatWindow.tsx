/**
 * ChatWindow component
 * Displays tabbed chat interface with message history
 */
import React, { useRef, useEffect } from 'react';
import type { ChatTab, Space, ChatMessage } from '../../types/space';
import { getColor } from '../../types/space';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  tabs: ChatTab[];
  activeTab: string | null;
  spaces: Space[];
  messages: ChatMessage[];
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  isDarkMode: boolean;
  isTyping?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  tabs,
  activeTab,
  spaces,
  messages,
  onActivateTab,
  onCloseTab,
  isDarkMode,
  isTyping = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeTabData = tabs.find(t => t.id === activeTab);
  const space = activeTabData ? spaces.find(s => s.id === activeTabData.spaceId) : null;

  // No tabs open
  if (tabs.length === 0 || !activeTabData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>💬</span>
          <h2 className={styles.emptyTitle}>No Chat Open</h2>
          <p className={styles.emptyText}>
            Select a space from the sidebar to start a conversation,
            or create a new space to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        <div className={styles.tabs}>
          {tabs.map(tab => {
            const tabSpace = spaces.find(s => s.id === tab.spaceId);
            if (!tabSpace) return null;
            
            const isActive = tab.id === activeTab;
            const unreadCount = tab.messages.filter(m => m.role === 'assistant').length;

            return (
              <div
                key={tab.id}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={() => onActivateTab(tab.id)}
              >
                <div 
                  className={styles.tabDot}
                  style={{ backgroundColor: getColor(tabSpace.id) }}
                />
                <span className={styles.tabTitle}>{tab.title}</span>
                {unreadCount > 0 && !isActive && (
                  <span className={styles.tabBadge}>{unreadCount}</span>
                )}
                <button
                  className={styles.tabClose}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  aria-label={`Close ${tab.title}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Space Info Bar */}
      {space && (
        <div className={styles.spaceInfoBar}>
          <div 
            className={styles.spaceInfoAvatar}
            style={{ backgroundColor: getColor(space.id) }}
          >
            {space.name[0].toUpperCase()}
          </div>
          <div className={styles.spaceInfoText}>
            <span className={styles.spaceInfoName}>{space.name}</span>
            <span className={styles.spaceInfoInstructions}>
              {space.customInstructions.slice(0, 80)}...
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <span className={styles.welcomeIcon}>👋</span>
            <h3 className={styles.welcomeTitle}>Start a conversation</h3>
            <p className={styles.welcomeText}>
              Type a message below to chat with the AI in the "{activeTabData.title}" space.
            </p>
            {space?.customInstructions && (
              <div className={styles.instructionsPreview}>
                <strong>Custom Instructions:</strong>
                <p>{space.customInstructions}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageHeader}>
                  <span className={styles.messageRole}>
                    {message.role === 'user' ? 'You' : space?.name || 'AI'}
                  </span>
                  <span className={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className={styles.messageContent}>
                  {formatMessageContent(message.content)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={styles.typingIndicator}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple markdown-like formatter
function formatMessageContent(content: string): React.ReactNode {
  // Split by double newlines for paragraphs
  const paragraphs = content.split('\n\n');
  
  return paragraphs.map((para, index) => {
    // Handle code blocks
    if (para.startsWith('```')) {
      const codeContent = para.replace(/```[\w]*\n?/, '').replace(/```$/, '');
      return (
        <pre key={index} className={styles.codeBlock}>
          <code>{codeContent}</code>
        </pre>
      );
    }

    // Handle inline formatting
    const formattedPara = para.split('\n').map((line, lineIndex) => {
      // Bold
      let processedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processedLine = processedLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
      // Inline code
      processedLine = processedLine.replace(/`(.+?)`/g, '<code class="inline-code">$1</code>');

      return (
        <span key={lineIndex}>
          <span dangerouslySetInnerHTML={{ __html: processedLine }} />
          {lineIndex < para.split('\n').length - 1 && <br />}
        </span>
      );
    });

    return <p key={index}>{formattedPara}</p>;
  });
}