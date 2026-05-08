import axios from 'axios';

const isProduction = typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

/**
 * Fetch current ISS position
 */
export const fetchISSPosition = async () => {
  try {
    const url = isProduction ? '/api/iss' : 'http://api.open-notify.org/iss-now.json';
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (data.message === 'success') {
      return {
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp,
      };
    }
    throw new Error('Invalid response');
  } catch {
    // Fallback to wheretheiss.at (supports HTTPS natively)
    try {
      const r = await axios.get('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 8000 });
      return {
        latitude: parseFloat(r.data.latitude),
        longitude: parseFloat(r.data.longitude),
        timestamp: Math.floor(r.data.timestamp),
      };
    } catch {
      throw new Error('ISS API temporarily unavailable. Will retry...');
    }
  }
};

/**
 * Fetch astronauts in space
 */
export const fetchAstronauts = async () => {
  try {
    const url = isProduction ? '/api/astros' : 'http://api.open-notify.org/astros.json';
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    if (data.message === 'success') {
      return { number: data.number, people: data.people };
    }
    return null;
  } catch {
    return null;
  }
};

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => deg * (Math.PI / 180);

export const calculateSpeed = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;
  const dist = haversineDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
  const t = Math.abs(pos2.timestamp - pos1.timestamp);
  return t === 0 ? 0 : Math.round((dist / t) * 3600 * 100) / 100;
};

export const getNearestLocation = async (lat, lon) => {
  try {
    const r = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=5&accept-language=en`, { headers: { 'User-Agent': 'ISS-Dashboard/1.0' }, timeout: 5000 });
    return r.data?.display_name || getOceanName(lat, lon);
  } catch { return getOceanName(lat, lon); }
};

const getOceanName = (lat, lon) => {
  if (lon > 20 && lon < 147 && lat > -60 && lat < 30) return 'Over ocean / remote area (Indian Ocean)';
  if (lon > -80 && lon < 0 && lat > -60 && lat < 60) return 'Over ocean / remote area (Atlantic Ocean)';
  if ((lon > 100 || lon < -100) && lat > -60 && lat < 60) return 'Over ocean / remote area (Pacific Ocean)';
  if (lat > 60) return 'Over ocean / remote area (Arctic)';
  if (lat < -60) return 'Over ocean / remote area (Southern Ocean)';
  return 'Over ocean / remote area';
};
