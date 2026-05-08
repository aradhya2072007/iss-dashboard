import axios from 'axios';

const NEWS_API_BASE = 'https://newsapi.org/v2';
const CACHE_KEY = 'news_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in ms

/**
 * Get cached news articles from localStorage
 */
const getCachedNews = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

/**
 * Cache news articles to localStorage
 */
const setCacheNews = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage might be full
  }
};

/**
 * Fetch top headlines from NewsAPI
 */
export const fetchNews = async (query = '') => {
  // Check cache first
  const cached = getCachedNews();
  if (cached && !query) return cached;

  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey || apiKey === 'your_newsapi_key_here') {
    throw new Error('Please set VITE_NEWS_API_KEY in your .env file');
  }

  try {
    const params = {
      apiKey,
      pageSize: 10,
      language: 'en',
    };

    let url = `${NEWS_API_BASE}/top-headlines`;
    if (query) {
      url = `${NEWS_API_BASE}/everything`;
      params.q = query;
      params.sortBy = 'publishedAt';
    } else {
      params.country = 'us';
    }

    const response = await axios.get(url, { params });

    if (response.data.status === 'ok') {
      const articles = response.data.articles.map((article, index) => ({
        id: `${article.source?.id || 'unknown'}-${index}-${Date.now()}`,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source?.name || 'Unknown',
        author: article.author,
        content: article.content,
      }));

      if (!query) {
        setCacheNews(articles);
      }
      return articles;
    }
    throw new Error(response.data.message || 'Failed to fetch news');
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your VITE_NEWS_API_KEY.');
    }
    if (error.response?.status === 429) {
      throw new Error('API rate limit reached. Try again later.');
    }
    throw new Error(error.message || 'Failed to fetch news');
  }
};

/**
 * Sort articles by field
 */
export const sortArticles = (articles, sortBy) => {
  const sorted = [...articles];
  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    case 'source':
      return sorted.sort((a, b) => a.source.localeCompare(b.source));
    default:
      return sorted;
  }
};
