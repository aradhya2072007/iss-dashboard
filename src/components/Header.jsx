const Header = ({ darkMode, toggleTheme }) => {
  return (
    <header className="px-6 lg:px-10 pt-6 pb-4 flex items-start justify-between">
      <div>
        <p className="text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--coral)' }}>
          Mission Control Dashboard
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>
          Real-Time ISS and News Intelligence
        </h1>
      </div>
      <button
        id="theme-toggle"
        onClick={toggleTheme}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium border cursor-pointer transition hover:opacity-80"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      >
        {darkMode ? 'Switch to Light' : 'Switch to Dark'}
      </button>
    </header>
  );
};

export default Header;
