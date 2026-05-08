import { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// Satellite emoji marker
const issIcon = L.divIcon({
  className: 'iss-icon',
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🛰️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const RecenterMap = ({ position }) => {
  const map = useMap();
  if (position) {
    map.setView([position.latitude, position.longitude], map.getZoom(), { animate: true, duration: 1 });
  }
  return null;
};

const ISSMap = ({ position, positions, location, darkMode }) => {
  const path = useMemo(() => positions.map(p => [p.latitude, p.longitude]), [positions]);

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (!position) {
    return (
      <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ height: '380px', background: 'var(--bg-input)' }}>
        <div className="skeleton w-16 h-16 rounded-full" />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ height: '380px', border: '1px solid var(--border)' }}>
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterMap position={position} />

        {/* Red trajectory line */}
        {path.length > 1 && (
          <Polyline
            positions={path}
            pathOptions={{ color: '#e8735a', weight: 2.5, opacity: 0.9 }}
          />
        )}

        {/* ISS Marker with permanent label */}
        <Marker position={[position.latitude, position.longitude]} icon={issIcon}>
          <Tooltip permanent direction="bottom" offset={[0, 12]} className="iss-tooltip">
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', lineHeight: '1.4' }}>
              <strong>ISS Current Position</strong><br />
              {position.latitude.toFixed(3)}, {position.longitude.toFixed(3)}<br />
              <span style={{ color: '#888' }}>{location || 'Over ocean / remote area'}</span>
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default ISSMap;
