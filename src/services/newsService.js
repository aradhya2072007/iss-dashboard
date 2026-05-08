import axios from 'axios';

const CACHE_KEY = 'news_cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

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

const setCacheNews = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

/**
 * Build the NewsAPI URL — on production (Vercel), use a CORS proxy
 * because NewsAPI free tier blocks non-localhost origins
 */
const getNewsUrl = (endpoint) => {
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const base = `https://newsapi.org/v2/${endpoint}`;
  if (isLocalhost) return base;
  return `https://corsproxy.io/?url=${encodeURIComponent(base)}`;
};

/**
 * Fetch top headlines from NewsAPI
 */
export const fetchNews = async (query = '') => {
  const cached = getCachedNews();
  if (cached && !query) return cached;

  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey || apiKey === 'your_newsapi_key_here') {
    throw new Error('Please set VITE_NEWS_API_KEY in your .env file');
  }

  try {
    let endpoint;
    if (query) {
      endpoint = `everything?apiKey=${apiKey}&pageSize=10&language=en&q=${encodeURIComponent(query)}&sortBy=publishedAt`;
    } else {
      endpoint = `top-headlines?apiKey=${apiKey}&pageSize=10&language=en&country=us`;
    }

    const url = getNewsUrl(endpoint);
    const response = await axios.get(url, { timeout: 15000 });

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

      if (!query) setCacheNews(articles);
      return articles;
    }
    throw new Error(response.data.message || 'Failed to fetch news');
  } catch (error) {
    if (error.response?.status === 401) throw new Error('Invalid API key.');
    if (error.response?.status === 426) throw new Error('NewsAPI requires upgrade for production. Using cached data.');
    if (error.response?.status === 429) throw new Error('API rate limit reached. Try again later.');
    throw new Error(error.message || 'Failed to fetch news');
  }
};

/**
 * Sort articles by field
 */
export const sortArticles = (articles, sortBy) => {
  const sorted = [...articles];
  switch (sortBy) {
    case 'date-desc': return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    case 'date-asc': return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    case 'source': return sorted.sort((a, b) => a.source.localeCompare(b.source));
    default: return sorted;
  }
};
