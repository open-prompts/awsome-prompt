import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../components/Layout';
import PromptCard from '../components/PromptCard';
import { getTemplates } from '../services/api';
import './Home.scss';

/**
 * Home page component.
 * Displays a grid of prompt templates with filtering and infinite scroll.
 */
const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [templates, setTemplates] = useState([]);
  const [privateTemplates, setPrivateTemplates] = useState([]);
  const [filters, setFilters] = useState({
    visibility: 'VISIBILITY_PUBLIC', // Default to public
    category: '',
    tags: [],
  });
  const [nextPageToken, setNextPageToken] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  // Update default filters on auth change
  useEffect(() => {
    if (isAuthenticated) {
      // If logged in, default to mixed view (no visibility filter)
      // Only do this if the user hasn't manually selected a filter yet?
      // For simplicity, we reset to default mixed view on login.
      setFilters(prev => ({ ...prev, visibility: '' }));
    } else {
      setFilters(prev => ({ ...prev, visibility: 'VISIBILITY_PUBLIC' }));
    }
  }, [isAuthenticated]);

  // Fetch templates when filters or page changes
  const fetchTemplates = useCallback(async (isNewFilter = false) => {
    if (loading) return;
    setLoading(true);

    try {
      // If new filter, use empty token. Else use stored next token.
      const currentToken = isNewFilter ? '' : nextPageToken;

      const params = {
        page_size: pageSize,
        page_token: currentToken,
        ...filters,
      };

      const response = await getTemplates(params);

      // Handle Public Templates (legacy field 'templates')
      const newTemplates = response.data.templates || [];
      // Handle Private Templates (new field)
      const newPrivateTemplates = response.data.private_templates || [];

      // Backend returns next_page_token for mixed view (combined) or simple view
      // Just store it.
      // const newNextToken = response.data.next_page_token || "";
      // Note: Backend logic puts combined token in next_page_token?
      // Let's check backend logic again.
      // Yes: return &pb.ListTemplatesResponse{ ..., NextPageToken: nextPublicToken (Wait!) }
      // I made a mistake in backend. I returned nextPublicToken as NextPageToken.
      // And nextPrivateToken as PrivateNextPageToken.
      // If I want "independent pagination" but a single "Load More" trigger,
      // I should combine them in the frontend or backend.
      // My backend returned specific tokens.
      // Frontend needs to combine them to send back in `page_token`.
      // Format: "public:private"

      let nextTokenToStore = "";
      if (response.data.private_next_page_token) {
          // Mixed mode logic check:
          // Backend should have returned combined token if it wanted client to be opaque?
          // I used `strings.Split` in backend.
          // So I should construct the token here.
          // const pToken = response.data.next_page_token || (newTemplates.length ? "0" : ""); // unsafe assumption?
          // If backend returns "" it means end of list.
          // If backend returns token, it's the offset.
          // My backend logic:
          // nextPublicToken = strconv.Itoa(offset + limit) if more.
          // So if I receive tokens, I combine them.
           nextTokenToStore = `${response.data.next_page_token || ''}:${response.data.private_next_page_token || ''}`;
      } else {
          // Single list mode
          nextTokenToStore = response.data.next_page_token || "";
      }

      if (isNewFilter) {
        setTemplates(newTemplates);
        setPrivateTemplates(newPrivateTemplates);
      } else {
        setTemplates((prev) => [...prev, ...newTemplates]);
        setPrivateTemplates((prev) => [...prev, ...newPrivateTemplates]);
      }

      setNextPageToken(nextTokenToStore);

      // Has More Logic
      // If mixed view, has more if EITHER has token.
      // If single view, has more if token exists.
      if (nextTokenToStore && nextTokenToStore !== ":") {
        setHasMore(true);
      } else {
        setHasMore(false);
      }

    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, nextPageToken, loading, pageSize]); // Add nextPageToken to deps?
  // No, nextPageToken is state, if I include it, it might trigger loops if not careful.
  // But strictly `fetchTemplates` depends on current `nextPageToken` state if `!isNewFilter`.
  // Actually, usually we pass token as arg or use ref. State is fine if we are careful.
  // `handleScroll` calls `fetchTemplates(false)`.

  // Initial load and filter changes
  useEffect(() => {
    fetchTemplates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  // removed page dep. added filters.

  // Handle filter changes from Sidebar
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Refresh list trigger (can be passed to children if needed)
  const refreshList = () => {
    fetchTemplates(true);
  };

  // Infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
      fetchTemplates(false);
    }
  };

  const isMixedView = !filters.visibility && isAuthenticated && !filters.my_likes && !filters.my_favorites;
  const isSpecialView = filters.my_likes || filters.my_favorites;

  // Calculate tags from visible templates for Sidebar
  const visibleTags = useMemo(() => {
    const allTemplates = [...templates, ...privateTemplates];
    const tagCounts = {};
    allTemplates.forEach(t => {
      if (t.tags && Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    // Convert to array format expected by Sidebar [{ name, count }]
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [templates, privateTemplates]);

  return (
    <Layout
      onFilterChange={handleFilterChange}
      currentFilters={filters}
      onCreateSuccess={refreshList}
      availableTags={visibleTags}
    >
      <div className="home-page" onScroll={handleScroll}>

        {isSpecialView && (
             <div className="section-header">
             <h2>{filters.my_likes ? 'My Likes' : 'My Favorites'}</h2>
          </div>
        )}

        {isMixedView && privateTemplates.length > 0 && (
          <div className="section-header">
             <h2>My Private Prompts</h2>
          </div>
        )}

        {privateTemplates.length > 0 && (
           <div className="templates-grid private-grid">
            {privateTemplates.map((template) => (
              <PromptCard key={template.id} template={template} />
            ))}
          </div>
        )}

        {isMixedView && templates.length > 0 && (
             <div className="section-header">
             <h2>Public Prompts</h2>
          </div>
        )}

        <div className="templates-grid">
          {templates.map((template) => (
            <PromptCard key={template.id} template={template} />
          ))}
        </div>

        {loading && <div className="loading">Loading...</div>}
        {!loading && templates.length === 0 && privateTemplates.length === 0 && (
          <div className="no-results">No templates found.</div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
