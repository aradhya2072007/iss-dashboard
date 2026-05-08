import { useState, useRef } from 'react';

const NewsPanel = ({ articles, loading, error, searchQuery, sortBy, handleSearch, handleSort, refresh }) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [expandedId, setExpandedId] = useState(null);
  const searchTimeout = useRef(null);

  const onSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 500);
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' +
      date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return (
    <div className="card p-5">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Breaking News</h2>
        <button onClick={refresh} disabled={loading} className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition hover:opacity-80" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          Refresh
        </button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          id="news-search"
          type="text"
          value={localSearch}
          onChange={onSearchChange}
          placeholder="Search title, source, author..."
          className="flex-1 px-4 py-2.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <select
          id="news-sort"
          value={sortBy}
          onChange={(e) => handleSort(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm border cursor-pointer"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          <option value="date-desc">Sort by Date</option>
          <option value="date-asc">Sort by Date (Oldest)</option>
          <option value="source">Sort by Source</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--coral-light)', color: 'var(--coral)' }}>
          {error}
          <button onClick={refresh} className="ml-2 underline cursor-pointer font-medium">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>}

      {/* Articles */}
      {!loading && !error && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {articles.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No articles found</p>
          ) : articles.map((article, idx) => (
            <div key={article.id} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              {/* Collapsed row */}
              <button
                onClick={() => setExpandedId(prev => prev === article.id ? null : article.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              >
                {/* Numbered thumbnail */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                  {article.urlToImage ? (
                    <img src={article.urlToImage} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; }} />
                  ) : null}
                  <span className="absolute top-0 left-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-br-lg" style={{ background: 'var(--coral)' }}>{idx + 1}</span>
                </div>

                {/* Source badge + date */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--coral)' }}>{article.source}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(article.publishedAt)}</span>
                  </div>
                  {expandedId !== article.id && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{article.title}</p>
                  )}
                </div>

                {/* Coral arrow */}
                <span className="flex-shrink-0 text-lg transition-transform" style={{ color: 'var(--coral)', transform: expandedId === article.id ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
              </button>

              {/* Expanded content */}
              {expandedId === article.id && (
                <div className="px-4 pb-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                  {article.description && <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>{article.description}</p>}
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold" style={{ color: 'var(--coral)' }}>Read More →</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPanel;
