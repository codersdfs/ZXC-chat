/**
 * MessageInput component
 * Text input area with markdown support and send functionality
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  isDarkMode?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  isDarkMode = false
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(() => {
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Insert markdown formatting
  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    const before = message.substring(0, start);
    const after = message.substring(end);

    const newText = before + prefix + selectedText + suffix + after;
    setMessage(newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  }, [message]);

  const handleBold = () => insertMarkdown('**', '**');
  const handleItalic = () => insertMarkdown('*', '*');
  const handleCode = () => insertMarkdown('`', '`');
  const handleCodeBlock = () => insertMarkdown('\n```\n', '\n```');

  return (
    <div className={`${styles.container} ${isFocused ? styles.focused : ''}`}>
      {/* Formatting Toolbar */}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleBold}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleItalic}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleCode}
          title="Inline Code"
          aria-label="Inline code"
        >
          <span className={styles.codeIcon}>{}</span>
        </button>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={handleCodeBlock}
          title="Code Block"
          aria-label="Code block"
        >
          <code>{'{ }'}</code>
        </button>
        <div className={styles.toolbarDivider} />
        <span className={styles.toolbarHint}>
          Press <kbd>Enter</kbd> to send, <kbd>Shift+Enter</kbd> for new line
        </span>
      </div>

      {/* Text Area */}
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
        />
        
        {/* Send Button */}
        <button
          className={`${styles.sendBtn} ${message.trim() ? styles.sendBtnActive : ''}`}
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          aria-label="Send message"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>
    </div>
  );
};