import axios from 'axios';

// Multiple ISS API sources for reliability
const ISS_APIS = [
  'https://api.wheretheiss.at/v1/satellites/25544',
  'https://corsproxy.io/?url=http://api.open-notify.org/iss-now.json',
];

/**
 * Fetch current ISS position — tries multiple APIs
 */
export const fetchISSPosition = async () => {
  // Try wheretheiss.at first
  try {
    const response = await axios.get(ISS_APIS[0], { timeout: 8000 });
    const d = response.data;
    return {
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      timestamp: Math.floor(d.timestamp),
    };
  } catch {
    // ignore, try next
  }

  // Try CORS-proxied open-notify
  try {
    const response = await axios.get(ISS_APIS[1], { timeout: 8000 });
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    if (data.message === 'success') {
      return {
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude),
        timestamp: data.timestamp,
      };
    }
  } catch {
    // ignore
  }

  throw new Error('ISS API temporarily unavailable. Will retry...');
};

/**
 * Fetch astronauts currently in space
 */
export const fetchAstronauts = async () => {
  try {
    const response = await axios.get('https://corsproxy.io/?url=http://api.open-notify.org/astros.json', { timeout: 10000 });
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    if (data.message === 'success') {
      return { number: data.number, people: data.people };
    }
    throw new Error('Failed');
  } catch {
    // Return some hardcoded fallback data
    return null;
  }
};

/**
 * Calculate distance using Haversine formula
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

export const calculateSpeed = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;
  const distance = haversineDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
  const timeDiff = Math.abs(pos2.timestamp - pos1.timestamp);
  if (timeDiff === 0) return 0;
  return Math.round(((distance / timeDiff) * 3600) * 100) / 100;
};

export const getNearestLocation = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=5&accept-language=en`,
      { headers: { 'User-Agent': 'ISS-Dashboard/1.0' }, timeout: 5000 }
    );
    if (response.data?.display_name) return response.data.display_name;
    return getOceanName(lat, lon);
  } catch {
    return getOceanName(lat, lon);
  }
};

const getOceanName = (lat, lon) => {
  if (lon > 20 && lon < 147 && lat > -60 && lat < 30) return 'Over ocean / remote area (Indian Ocean)';
  if (lon > -80 && lon < 0 && lat > -60 && lat < 60) return 'Over ocean / remote area (Atlantic Ocean)';
  if ((lon > 100 || lon < -100) && lat > -60 && lat < 60) return 'Over ocean / remote area (Pacific Ocean)';
  if (lat > 60) return 'Over ocean / remote area (Arctic)';
  if (lat < -60) return 'Over ocean / remote area (Southern Ocean)';
  return 'Over ocean / remote area';
};
