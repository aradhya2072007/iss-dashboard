import axios from 'axios';

const isProduction = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const CACHE_KEY = 'news_cache';
const CACHE_DURATION = 15 * 60 * 1000;

const getCachedNews = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { localStorage.removeItem(CACHE_KEY); return null; }
};

const setCacheNews = (data) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch {}
};

export const fetchNews = async (query = '') => {
  const cached = getCachedNews();
  if (cached && !query) return cached;

  try {
    let url;
    if (isProduction) {
      // Use Vercel serverless proxy
      url = query ? `/api/news?q=${encodeURIComponent(query)}` : '/api/news';
    } else {
      // Direct API on localhost
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      if (!apiKey) throw new Error('Please set VITE_NEWS_API_KEY in your .env file');
      url = query
        ? `https://newsapi.org/v2/everything?apiKey=${apiKey}&pageSize=10&language=en&q=${encodeURIComponent(query)}&sortBy=publishedAt`
        : `https://newsapi.org/v2/top-headlines?apiKey=${apiKey}&pageSize=10&language=en&country=us`;
    }

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
    throw new Error(error.message || 'Failed to fetch news');
  }
};

export const sortArticles = (articles, sortBy) => {
  const sorted = [...articles];
  switch (sortBy) {
    case 'date-desc': return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    case 'date-asc': return sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    case 'source': return sorted.sort((a, b) => a.source.localeCompare(b.source));
    default: return sorted;
  }
};
