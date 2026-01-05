import React, { useEffect, useState } from 'react';
import { getCategories, getTags } from '../services/api';
import './Sidebar.scss';

/**
 * Sidebar component.
 * Displays navigation for Prompt Square, My Prompts, and Tag Cloud.
 * @param {Object} props - Component props
 * @param {Function} props.onFilterChange - Callback when a filter is selected
 */
const Sidebar = ({ onFilterChange }) => {
  const [categories, setCategories] = useState([]);
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

  // Limit categories to top 10 unless "More" is clicked
  const displayedCategories = showAllCategories ? categories : categories.slice(0, 10);

  const handleCategoryClick = (category, visibility) => {
    onFilterChange({ category, visibility });
  };

  const handleTagClick = (tag) => {
    onFilterChange({ tags: [tag] }); // Assuming single tag filter for now
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h3>Prompt Square</h3>
        <ul>
          <li onClick={() => handleCategoryClick(null, 'VISIBILITY_PUBLIC')}>All Public</li>
          {displayedCategories.map((cat) => (
            <li key={cat.name} onClick={() => handleCategoryClick(cat.name, 'VISIBILITY_PUBLIC')}>
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

      <div className="sidebar-section">
        <h3>My Prompts</h3>
        <ul>
          <li onClick={() => handleCategoryClick(null, 'VISIBILITY_PRIVATE')}>All Private</li>
          {/* Reusing categories for private section for simplicity, 
              though ideally we might want to fetch private-specific categories stats */}
          {displayedCategories.map((cat) => (
            <li key={`private-${cat.name}`} onClick={() => handleCategoryClick(cat.name, 'VISIBILITY_PRIVATE')}>
              {cat.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Tags</h3>
        <div className="tag-cloud">
          {tags.map((tag) => (
            <span key={tag.name} className="tag" onClick={() => handleTagClick(tag.name)}>
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
