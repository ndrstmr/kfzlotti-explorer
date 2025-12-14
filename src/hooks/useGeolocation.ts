/**
 * Geolocation hook for user position
 * Privacy-first: only activates on explicit user action
 */

import { useState, useCallback } from 'react';
import { haversineDistance } from '@/lib/geo';

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
    isSupported: 'geolocation' in navigator,
  });

  const requestLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({
        ...prev,
        error: 'Dein Gerät unterstützt keine Standortbestimmung.',
        isLoading: false,
      }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState({
            position: coords,
            error: null,
            isLoading: false,
            isSupported: true,
          });
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Standort konnte nicht ermittelt werden.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Du hast die Standortfreigabe abgelehnt. Das ist völlig okay!';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Dein Standort ist gerade nicht verfügbar.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Die Standortabfrage hat zu lange gedauert.';
              break;
          }
          
          setState({
            position: null,
            error: errorMessage,
            isLoading: false,
            isSupported: true,
          });
          resolve(null);
        },
        {
          enableHighAccuracy: false, // Battery-friendly
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }, []);

  const clearPosition = useCallback(() => {
    setState({
      position: null,
      error: null,
      isLoading: false,
      isSupported: 'geolocation' in navigator,
    });
  }, []);

  const getDistanceTo = useCallback(
    (targetLat: number, targetLng: number): number | null => {
      if (!state.position) return null;
      return haversineDistance(
        state.position.lat,
        state.position.lng,
        targetLat,
        targetLng
      );
    },
    [state.position]
  );

  return {
    ...state,
    requestLocation,
    clearPosition,
    getDistanceTo,
  };
}
