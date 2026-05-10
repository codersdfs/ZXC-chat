/**
 * Sidebar component for Spaces management
 * Displays workflow categories and space list
 */
import React from 'react';
import type { Space, WorkflowCategory } from '../../types/space';
import { getColor, formatLastActive } from '../../types/space';
import styles from './Sidebar.module.css';

interface SidebarProps {
  categories: WorkflowCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  spaces: Space[];
  filteredSpaces: Space[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenSpace: (spaceId: string) => void;
  onCreateSpace: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  spaces,
  filteredSpaces,
  searchQuery,
  onSearchChange,
  onOpenSpace,
  onCreateSpace
}) => {
  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>S</div>
          <span className={styles.logoText}>Spaces</span>
        </div>
        <button 
          className={styles.newSpaceBtn}
          onClick={onCreateSpace}
          aria-label="Create new space"
        >
          <svg className={styles.plusIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>New</span>
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search spaces..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Categories */}
      <nav className={styles.categories}>
        <span className={styles.sectionTitle}>Categories</span>
        {categories.map(category => (
          <button
            key={category.id}
            className={`${styles.categoryBtn} ${selectedCategory === category.id ? styles.categoryBtnActive : ''}`}
            onClick={() => onSelectCategory(category.id)}
          >
            <span className={styles.categoryIcon}>{category.icon}</span>
            <span className={styles.categoryName}>{category.name}</span>
            {category.id !== 'all' && (
              <span className={styles.categoryCount}>
                {category.spaceIds.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Spaces List */}
      <div className={styles.spacesList}>
        <span className={styles.sectionTitle}>
          Spaces ({filteredSpaces.length})
        </span>
        {filteredSpaces.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No spaces found</p>
          </div>
        ) : (
          filteredSpaces.map(space => (
            <button
              key={space.id}
              className={styles.spaceItem}
              onClick={() => onOpenSpace(space.id)}
            >
              <div 
                className={styles.spaceAvatar}
                style={{ backgroundColor: getColor(space.id) }}
              >
                {space.name[0].toUpperCase()}
              </div>
              <div className={styles.spaceInfo}>
                <span className={styles.spaceName}>{space.name}</span>
                <span className={styles.spaceTime}>
                  {formatLastActive(space.lastActive)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};