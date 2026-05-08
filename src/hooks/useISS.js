import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchISSPosition, fetchAstronauts, calculateSpeed, getNearestLocation } from '../services/issService';

const MAX_POSITIONS = 50;
const MAX_SPEED_HISTORY = 30;
const REFRESH_INTERVAL = 15000; // 15 seconds

export const useISS = () => {
  const [position, setPosition] = useState(null);
  const [positions, setPositions] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [astronauts, setAstronauts] = useState(null);
  const [location, setLocation] = useState('Calculating...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const fetchPosition = useCallback(async () => {
    try {
      const pos = await fetchISSPosition();
      
      setPositions(prev => {
        const updated = [...prev, pos].slice(-MAX_POSITIONS);
        
        // Calculate speed from last two positions
        if (updated.length >= 2) {
          const currentSpeed = calculateSpeed(
            updated[updated.length - 2],
            updated[updated.length - 1]
          );
          setSpeed(currentSpeed);
          setSpeedHistory(prevHistory => {
            const newHistory = [...prevHistory, {
              time: new Date(pos.timestamp * 1000).toLocaleTimeString(),
              speed: currentSpeed,
              timestamp: pos.timestamp,
            }].slice(-MAX_SPEED_HISTORY);
            return newHistory;
          });
        }
        
        return updated;
      });
      
      setPosition(pos);
      setError(null);

      // Get nearest location (don't block on this)
      getNearestLocation(pos.latitude, pos.longitude)
        .then(loc => setLocation(loc))
        .catch(() => setLocation('Unknown'));

    } catch (err) {
      // Only show error if we don't have data yet
      if (!position) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAstronautData = useCallback(async () => {
    try {
      const data = await fetchAstronauts();
      setAstronauts(data);
    } catch {
      // Non-critical, don't set error
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchPosition();
  }, [fetchPosition]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  useEffect(() => {
    fetchPosition();
    fetchAstronautData();
  }, [fetchPosition, fetchAstronautData]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchPosition, REFRESH_INTERVAL);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchPosition]);

  return {
    position,
    positions,
    speed,
    speedHistory,
    astronauts,
    location,
    loading,
    error,
    refresh,
    autoRefresh,
    toggleAutoRefresh,
    trackedCount: positions.length,
  };
};
