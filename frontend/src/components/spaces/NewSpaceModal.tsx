/**
 * NewSpaceModal component
 * Modal for creating a new space with custom instructions
 */
import React, { useState, useCallback } from 'react';
import styles from './NewSpaceModal.module.css';

interface NewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, instructions: string) => void;
  isDarkMode?: boolean;
}

export const NewSpaceModal: React.FC<NewSpaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isDarkMode = false
}) => {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [generating, setGenerating] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setInstructions('');
    setSuggestions('');
    setGenerating(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    onCreate(name.trim(), instructions.trim());
    resetForm();
  }, [name, instructions, onCreate, resetForm]);

  const handleSuggestQuestions = useCallback(() => {
    if (!name.trim()) return;
    
    setGenerating(true);
    
    // Simulate AI generating suggestions
    setTimeout(() => {
      const defaultQuestions = [
        'What are common problems or tasks in this space?',
        'What tone and style should the AI adopt?',
        'What are the expected inputs and outputs?',
        'What should the AI avoid or be cautious about?',
        'What tools or frameworks are used in this space?',
      ];
      setSuggestions(defaultQuestions.map(q => '• ' + q).join('\n'));
      setGenerating(false);
    }, 1500);
  }, [name]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Create New Space</h2>
          <button 
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="space-name">
              Space Name
            </label>
            <input
              id="space-name"
              type="text"
              className={styles.input}
              placeholder="e.g., AI Coding Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="space-instructions">
              Custom Instructions
            </label>
            <textarea
              id="space-instructions"
              className={styles.textarea}
              placeholder="Define how the AI should behave in this space..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
            />
            <p className={styles.hint}>
              These instructions will automatically apply to all conversations in this space.
            </p>
          </div>

          {/* Suggestions */}
          {suggestions && (
            <div className={styles.suggestions}>
              <h4 className={styles.suggestionsTitle}>Suggested Questions:</h4>
              <pre className={styles.suggestionsText}>{suggestions}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button
              className={styles.suggestBtn}
              onClick={handleSuggestQuestions}
              disabled={!name.trim() || generating}
            >
              {generating ? 'Generating...' : 'Suggest Questions for AI'}
            </button>
          </div>
          <div className={styles.footerRight}>
            <button
              className={styles.cancelBtn}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              Create Space
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};