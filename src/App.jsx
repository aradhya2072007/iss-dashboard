import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import ISSPanel from './components/ISSPanel';
import ISSMap from './components/ISSMap';
import NewsPanel from './components/NewsPanel';
import Chatbot from './components/Chatbot';
import SpeedChart from './components/Charts';
import { useISS } from './hooks/useISS';
import { useNews } from './hooks/useNews';
import { useTheme } from './hooks/useTheme';

function App() {
  const { darkMode, toggleTheme } = useTheme();
  const iss = useISS();
  const news = useNews();

  const chatIssData = {
    position: iss.position,
    speed: iss.speed,
    location: iss.location,
    astronauts: iss.astronauts,
    trackedPositions: iss.trackedCount,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', transition: 'background 0.3s' }}>
      <Toaster position="top-right" toastOptions={{ style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 13 } }} />

      <Header darkMode={darkMode} toggleTheme={toggleTheme} />

      {/* Two-column layout */}
      <main className="px-6 lg:px-10 pb-10">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* LEFT COLUMN — 65% */}
          <div className="w-full lg:w-[65%] space-y-5">
            {/* ISS Live Tracking card with stats */}
            <ISSPanel
              position={iss.position}
              speed={iss.speed}
              location={iss.location}
              loading={iss.loading}
              error={iss.error}
              trackedCount={iss.trackedCount}
              refresh={iss.refresh}
              autoRefresh={iss.autoRefresh}
              toggleAutoRefresh={iss.toggleAutoRefresh}
            />

            {/* Map */}
            <ISSMap
              position={iss.position}
              positions={iss.positions}
              location={iss.location}
              darkMode={darkMode}
            />

            {/* Breaking News */}
            <NewsPanel
              articles={news.articles}
              loading={news.loading}
              error={news.error}
              searchQuery={news.searchQuery}
              sortBy={news.sortBy}
              handleSearch={news.handleSearch}
              handleSort={news.handleSort}
              refresh={news.refresh}
            />
          </div>

          {/* RIGHT COLUMN — 35% */}
          <div className="w-full lg:w-[35%]">
            {/* ISS Speed Trend chart */}
            <SpeedChart speedHistory={iss.speedHistory} darkMode={darkMode} />
          </div>
        </div>
      </main>

      {/* Floating AI Chatbot */}
      <Chatbot issData={chatIssData} newsData={news.rawArticles} />
    </div>
  );
}

export default App;
