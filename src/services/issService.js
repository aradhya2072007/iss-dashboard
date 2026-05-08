import axios from 'axios';

// Primary: wheretheiss.at (HTTPS), Fallback: open-notify via CORS proxy
const ISS_PRIMARY = 'https://api.wheretheiss.at/v1/satellites/25544';
const ISS_FALLBACK = 'https://api.open-notify.org/iss-now.json';
const ASTROS_URL = 'https://api.open-notify.org/astros.json';

/**
 * Fetch current ISS position
 */
export const fetchISSPosition = async () => {
  // Try primary HTTPS API first
  try {
    const response = await axios.get(ISS_PRIMARY, { timeout: 8000 });
    const d = response.data;
    return {
      latitude: parseFloat(d.latitude),
      longitude: parseFloat(d.longitude),
      timestamp: Math.floor(d.timestamp),
    };
  } catch {
    // Fallback
    try {
      const response = await axios.get(ISS_FALLBACK, { timeout: 8000 });
      if (response.data.message === 'success') {
        return {
          latitude: parseFloat(response.data.iss_position.latitude),
          longitude: parseFloat(response.data.iss_position.longitude),
          timestamp: response.data.timestamp,
        };
      }
    } catch {
      // both failed
    }
    throw new Error('Unable to fetch ISS position');
  }
};

/**
 * Fetch astronauts currently in space
 */
export const fetchAstronauts = async () => {
  try {
    const response = await axios.get(ASTROS_URL, { timeout: 10000 });
    if (response.data.message === 'success') {
      return {
        number: response.data.number,
        people: response.data.people,
      };
    }
    throw new Error('Failed to fetch astronaut data');
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch astronaut data');
  }
};

/**
 * Calculate distance between two points using Haversine formula
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

/**
 * Calculate speed in km/h
 */
export const calculateSpeed = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;
  const distance = haversineDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
  const timeDiff = Math.abs(pos2.timestamp - pos1.timestamp);
  if (timeDiff === 0) return 0;
  return Math.round(((distance / timeDiff) * 3600) * 100) / 100;
};

/**
 * Reverse geocode to get nearest location name
 */
export const getNearestLocation = async (lat, lon) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=5&accept-language=en`,
      { headers: { 'User-Agent': 'ISS-Dashboard/1.0' }, timeout: 5000 }
    );
    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
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
