import { useState, useCallback, useEffect } from 'react';
import { fetchNews, sortArticles } from '../services/newsService';

export const useNews = () => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const loadNews = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(query);
      setArticles(data);
      setFilteredArticles(sortArticles(data, sortBy));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    if (query.trim()) {
      loadNews(query.trim());
    } else {
      loadNews();
    }
  }, [loadNews]);

  const handleSort = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    setFilteredArticles(sortArticles(articles, newSortBy));
  }, [articles]);

  const refresh = useCallback(() => {
    // Clear cache by removing from localStorage
    localStorage.removeItem('news_cache');
    loadNews(searchQuery);
  }, [loadNews, searchQuery]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Get source distribution for pie chart
  const sourceDistribution = filteredArticles.reduce((acc, article) => {
    const source = article.source || 'Unknown';
    const existing = acc.find(s => s.name === source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: source, value: 1 });
    }
    return acc;
  }, []);

  return {
    articles: filteredArticles,
    rawArticles: articles,
    loading,
    error,
    searchQuery,
    sortBy,
    handleSearch,
    handleSort,
    refresh,
    sourceDistribution,
  };
};
