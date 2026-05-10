/**
 * TopNavigation component
 * Displays persona selector, theme toggle, and user profile
 */
import React from 'react';
import type { Persona } from '../../types/space';
import styles from './TopNavigation.module.css';

interface TopNavigationProps {
  personas: Persona[];
  selectedPersona: Persona;
  onPersonaChange: (personaId: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  userName?: string;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  personas,
  selectedPersona,
  onPersonaChange,
  isDarkMode,
  onToggleTheme,
  userName = 'User'
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = React.useState(false);

  return (
    <header className={styles.nav}>
      <div className={styles.navContent}>
        {/* Left side - empty for spacing */}
        <div className={styles.navLeft} />

        {/* Center - Persona Selector */}
        <div className={styles.navCenter}>
          <div className={styles.personaSelector}>
            <button
              className={styles.personaBtn}
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              aria-expanded={showPersonaMenu}
              aria-haspopup="true"
            >
              <span className={styles.personaIcon}>{selectedPersona.icon}</span>
              <span className={styles.personaName}>{selectedPersona.name}</span>
              <svg className={styles.chevronIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Persona Dropdown Menu */}
            {showPersonaMenu && (
              <div className={styles.personaMenu}>
                {personas.map(persona => (
                  <button
                    key={persona.id}
                    className={`${styles.personaMenuItem} ${persona.id === selectedPersona.id ? styles.personaMenuItemActive : ''}`}
                    onClick={() => {
                      onPersonaChange(persona.id);
                      setShowPersonaMenu(false);
                    }}
                  >
                    <span className={styles.personaMenuIcon}>{persona.icon}</span>
                    <div className={styles.personaMenuInfo}>
                      <span className={styles.personaMenuName}>{persona.name}</span>
                      <span className={styles.personaMenuDesc}>{persona.description}</span>
                    </div>
                    {persona.id === selectedPersona.id && (
                      <svg className={styles.checkIcon} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Theme toggle and user */}
        <div className={styles.navRight}>
          <button
            className={styles.themeToggle}
            onClick={onToggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? (
              <svg className={styles.themeIcon} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className={styles.themeIcon} viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              {userName[0].toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showPersonaMenu && (
        <div 
          className={styles.menuOverlay}
          onClick={() => setShowPersonaMenu(false)}
        />
      )}
    </header>
  );
};