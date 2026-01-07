import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCategories, getTags } from '../services/api';
import './Sidebar.scss';

/**
 * Sidebar component.
 * Displays navigation for Prompt Square, My Prompts, and Tag Cloud.
 * @param {Object} props - Component props
 * @param {Function} props.onFilterChange - Callback when a filter is selected
 * @param {Object} props.currentFilters - Current active filters
 * @param {Array} props.availableTags - Tags to display (overrides fetching)
 */
const Sidebar = ({ onFilterChange, currentFilters, availableTags }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    // Fetch categories and tags on mount
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
             getCategories(),
             availableTags ? Promise.resolve({ data: { tags: [] } }) : getTags() // skip fetch if props provided
        ]);
        setCategories(catRes.data.categories || []);
        if (!availableTags) {
             setTags(tagRes.data.tags || []);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };
    fetchData();
  }, [availableTags]); // Re-run if availableTags changes? No, infinite loop risk if object ref changes.

  // Use availableTags if present, otherwise fetched tags.
  const displayedTags = availableTags || tags;

  // Limit categories to top 10 unless "More" is clicked
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);
  // const displayedPrivateCategories = privateCategories.slice(0, 10); // Assume limit for private too

  const handleCategoryClick = (category, visibility) => {
    onFilterChange({
        category,
        visibility,
        tags: [],
        my_likes: false,
        my_favorites: false
    });
  };

  const handleTagClick = (tag) => {
    onFilterChange({
        tags: [tag],
        my_likes: false,
        my_favorites: false
    });
  };

  const handleSpecialFilterClick = (type) => {
      if (type === 'likes') {
          onFilterChange({
            category: '',
            tags: [],
            visibility: '', // Search all visibilities
            my_likes: true,
            my_favorites: false
          });
      } else if (type === 'favorites') {
          onFilterChange({
            category: '',
            tags: [],
            visibility: '',
            my_likes: false,
            my_favorites: true
          });
      }
  };

  const isActive = (type, value, visibility) => {
    if (!currentFilters) return false;
    if (type === 'all-public') return currentFilters.visibility === 'VISIBILITY_PUBLIC' && !currentFilters.category && !currentFilters.my_likes && !currentFilters.my_favorites;
    if (type === 'all-private') return currentFilters.visibility === 'VISIBILITY_PRIVATE' && !currentFilters.category && !currentFilters.my_likes && !currentFilters.my_favorites;
    if (type === 'category') return currentFilters.category === value && currentFilters.visibility === visibility;
    if (type === 'tag') return currentFilters.tags && currentFilters.tags.includes(value);
    if (type === 'likes') return !!currentFilters.my_likes;
    if (type === 'favorites') return !!currentFilters.my_favorites;
    return false;
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h3>Prompt Square</h3>
        <ul>
          <li
            className={isActive('all-public') ? 'active' : ''}
            onClick={() => handleCategoryClick(null, 'VISIBILITY_PUBLIC')}
          >
            All Public
          </li>
          {displayedCategories.map((cat) => (
            <li
              key={cat.name}
              className={isActive('category', cat.name, 'VISIBILITY_PUBLIC') ? 'active' : ''}
              onClick={() => handleCategoryClick(cat.name, 'VISIBILITY_PUBLIC')}
            >
              {cat.name} <span className="count">({cat.count})</span>
            </li>
          ))}
        </ul>
        {categories.length > 10 && !showAllCategories && (
          <button className="btn-more" onClick={() => setShowAllCategories(true)}>
            More...
          </button>
        )}
      </div>

      {isAuthenticated && (
        <div className="sidebar-section">
          <h3>My Library</h3>
          <ul>
            <li
              className={isActive('all-private') ? 'active' : ''}
              onClick={() => handleCategoryClick(null, 'VISIBILITY_PRIVATE')}
            >
              My Prompts
            </li>
            <li
              className={isActive('likes') ? 'active' : ''}
              onClick={() => handleSpecialFilterClick('likes')}
            >
              My Likes
            </li>
            <li
              className={isActive('favorites') ? 'active' : ''}
              onClick={() => handleSpecialFilterClick('favorites')}
            >
              My Favorites
            </li>
            {/* Private Categories could go here if we filtered them separately,
                but typically they are just subsets of My Prompts */}
          </ul>
        </div>
      )}


      <div className="sidebar-section">
        <h3>Tags</h3>
        <div className="tag-cloud">
          {displayedTags.map((tag) => (
            <span
              key={tag.name}
              className={`tag ${isActive('tag', tag.name) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag.name)}
            >
              {tag.name} <small>{tag.count > 0 ? `(${tag.count})` : ''}</small>
            </span>
          ))}
          {displayedTags.length === 0 && <span className="no-tags">No tags</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
