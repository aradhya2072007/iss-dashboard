const ISSPanel = ({ position, speed, location, loading, error, trackedCount, refresh, autoRefresh, toggleAutoRefresh }) => {
  return (
    <div className="card p-5">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>ISS Live Tracking</h2>
        <div className="flex items-center gap-2">
          <button
            id="iss-refresh"
            onClick={refresh}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition hover:opacity-80"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Refresh Now
          </button>
          <button
            id="auto-refresh-toggle"
            onClick={toggleAutoRefresh}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition hover:opacity-80"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--coral-light)', color: 'var(--coral)' }}>
          {error}
          <button onClick={refresh} className="ml-2 underline cursor-pointer font-medium">Retry</button>
        </div>
      )}

      {/* Stat cards row */}
      {loading && !position ? (
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Lat/Lon */}
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Latitude / Longitude</div>
            <div className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {position?.latitude?.toFixed(3)}, {position?.longitude?.toFixed(3)}
            </div>
          </div>
          {/* Speed */}
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Speed</div>
            <div className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {speed.toFixed(2)} km/h
            </div>
          </div>
          {/* Nearest Place */}
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Nearest Place</div>
            <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }} title={location}>
              {location}
            </div>
          </div>
          {/* Tracked */}
          <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Tracked Positions</div>
            <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{trackedCount}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ISSPanel;
