import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import PromptCard from '../components/PromptCard';
import { getTemplates } from '../services/api';
import './Home.scss';

/**
 * Home page component.
 * Displays a grid of prompt templates with filtering and infinite scroll.
 */
const Home = () => {
  const [templates, setTemplates] = useState([]);
  const [filters, setFilters] = useState({
    visibility: 'VISIBILITY_PUBLIC', // Default to public
    category: '',
    tags: [],
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  // Fetch templates when filters or page changes
  const fetchTemplates = useCallback(async (isNewFilter = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const currentOffset = isNewFilter ? 0 : page * pageSize;
      const params = {
        page_size: pageSize,
        page_token: currentOffset.toString(), // Backend expects string token, we use offset
        ...filters,
      };

      const response = await getTemplates(params);
      const newTemplates = response.data.templates || [];

      if (isNewFilter) {
        setTemplates(newTemplates);
        setPage(1);
      } else {
        setTemplates((prev) => [...prev, ...newTemplates]);
        setPage((prev) => prev + 1);
      }

      if (newTemplates.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, loading]);

  // Initial load and filter changes
  useEffect(() => {
    fetchTemplates(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Handle filter changes from Sidebar
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Infinite scroll handler
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loading) {
      fetchTemplates(false);
    }
  };

  return (
    <Layout onFilterChange={handleFilterChange}>
      <div className="home-page" onScroll={handleScroll}>
        <div className="templates-grid">
          {templates.map((template) => (
            <PromptCard key={template.id} template={template} />
          ))}
        </div>
        {loading && <div className="loading">Loading...</div>}
        {!loading && templates.length === 0 && (
          <div className="no-results">No templates found.</div>
        )}
      </div>
    </Layout>
  );
};

export default Home;
