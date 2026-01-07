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
 */
const Sidebar = ({ onFilterChange, currentFilters }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [privateCategories, setPrivateCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    // Fetch categories and tags on mount
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([getCategories(), getTags()]);
        setCategories(catRes.data.categories || []);
        setTags(tagRes.data.tags || []);
      } catch (error) {
        console.error('Failed to fetch sidebar data:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      getCategories({ owner_id: user.id }).then((res) => {
        setPrivateCategories(res.data.categories || []);
      }).catch(err => console.error(err));
    } else {
      setPrivateCategories([]);
    }
  }, [isAuthenticated, user?.id]);

  // Limit categories to top 10 unless "More" is clicked
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);
  const displayedPrivateCategories = privateCategories.slice(0, 10); // Assume limit for private too

  const handleCategoryClick = (category, visibility) => {
    onFilterChange({ category, visibility, tags: [] }); // Reset tags when category clicked
  };

  const handleTagClick = (tag) => {
    onFilterChange({ tags: [tag] }); // Assuming single tag filter
  };

  const isActive = (type, value, visibility) => {
    if (!currentFilters) return false;
    if (type === 'all-public') return currentFilters.visibility === 'VISIBILITY_PUBLIC' && !currentFilters.category;
    if (type === 'all-private') return currentFilters.visibility === 'VISIBILITY_PRIVATE' && !currentFilters.category;
    if (type === 'category') return currentFilters.category === value && currentFilters.visibility === visibility;
    if (type === 'tag') return currentFilters.tags && currentFilters.tags.includes(value);
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
          <h3>My Prompts</h3>
          <ul>
            <li 
              className={isActive('all-private') ? 'active' : ''}
              onClick={() => handleCategoryClick(null, 'VISIBILITY_PRIVATE')}
            >
              All Private
            </li>
            {displayedPrivateCategories.map((cat) => (
              <li 
                key={`private-${cat.name}`} 
                className={isActive('category', cat.name, 'VISIBILITY_PRIVATE') ? 'active' : ''}
                onClick={() => handleCategoryClick(cat.name, 'VISIBILITY_PRIVATE')}
              >
                {cat.name} <span className="count">({cat.count})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sidebar-section">
        <h3>Tags</h3>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <span 
              key={tag.name} 
              className={`tag ${isActive('tag', tag.name) ? 'active' : ''}`}
              onClick={() => handleTagClick(tag.name)}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
