import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useGeolocation
 *
 * Custom hook wrapping the HTML5 Geolocation API.
 *
 * @param {object}   options
 * @param {boolean}  [options.autoRequest=false]  Whether to request position on mount.
 * @param {boolean}  [options.enableHighAccuracy=false]  Use GPS if available.
 * @param {number}   [options.timeout=10000]     Max time (ms) to wait for a position.
 * @param {number}   [options.maximumAge=0]      Accept cached positions up to this age (ms).
 *
 * @returns {{ latitude, longitude, error, loading, getCurrentPosition }}
 */
export default function useGeolocation({
  autoRequest = false,
  enableHighAccuracy = false,
  timeout = 10000,
  maximumAge = 0,
} = {}) {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track mount state to avoid state updates after unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // getCurrentPosition
  // ---------------------------------------------------------------------------
  const getCurrentPosition = useCallback(() => {
    // Guard: no geolocation support
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by this browser.';
      setError(msg);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!mountedRef.current) return;
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setError(null);
        setLoading(false);
      },
      (geoError) => {
        if (!mountedRef.current) return;
        let message;

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            message =
              'Location permission denied. Please allow location access in your browser settings.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            message =
              'Location information is unavailable. Please check your device settings.';
            break;
          case geoError.TIMEOUT:
            message =
              'The request to get your location timed out. Please try again.';
            break;
          default:
            message = 'An unknown geolocation error occurred.';
            break;
        }

        setError(message);
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  // ---------------------------------------------------------------------------
  // Auto-request on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (autoRequest) {
      getCurrentPosition();
    }
    // Only run on mount when autoRequest is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------
  return {
    latitude,
    longitude,
    error,
    loading,
    getCurrentPosition,
  };
}
