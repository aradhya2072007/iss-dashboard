import { useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SpeedChart = ({ speedHistory, darkMode }) => {
  const chartRef = useRef(null);

  const data = {
    labels: speedHistory.map(s => s.time),
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: speedHistory.map(s => s.speed),
        borderColor: '#e8735a',
        backgroundColor: 'rgba(232, 115, 90, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#e8735a',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'rect',
          font: { size: 11, family: 'Inter' },
          color: darkMode ? '#b0b0b0' : '#555',
        },
      },
      tooltip: {
        backgroundColor: darkMode ? '#23272f' : '#fff',
        titleColor: darkMode ? '#f0f0f0' : '#1a1a1a',
        bodyColor: darkMode ? '#b0b0b0' : '#555',
        borderColor: darkMode ? '#333840' : '#e8e0d8',
        borderWidth: 1,
        cornerRadius: 8,
        titleFont: { family: 'Inter', weight: '600' },
        bodyFont: { family: 'Inter' },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          font: { size: 9, family: 'Inter' },
          color: darkMode ? '#666' : '#999',
        },
        grid: { color: darkMode ? '#2a2e36' : '#f0ece6', drawBorder: false },
      },
      y: {
        ticks: {
          font: { size: 10, family: 'Inter' },
          color: darkMode ? '#666' : '#999',
          callback: (v) => v.toLocaleString(),
        },
        grid: { color: darkMode ? '#2a2e36' : '#f0ece6', drawBorder: false },
      },
    },
    animation: { duration: 300 },
  };

  // Force chart update when data changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [speedHistory]);

  return (
    <div className="card p-5">
      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>ISS Speed Trend</h3>
      <div style={{ height: '280px' }}>
        {speedHistory.length < 2 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Collecting speed data...</p>
          </div>
        ) : (
          <Line ref={chartRef} data={data} options={options} />
        )}
      </div>
    </div>
  );
};

export default SpeedChart;
