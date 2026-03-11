import { useRef, useEffect, useState } from 'react';

/**
 * Connects to the backend WebSocket for a camera and feeds JPEG
 * frames into an <img> ref via Blob URLs.
 *
 * Usage:
 *   const { imgRef, connected } = useWebSocketStream(camera.id);
 *   <img ref={imgRef} />
 */
export function useWebSocketStream(cameraId, enabled = true) {
  const imgRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!cameraId || !enabled) {
      setConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${cameraId}`;

    let ws = null;
    let reconnectTimer = null;
    let watchdogTimer = null;
    let active = true;

    const connect = () => {
      if (!active) return;

      ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';

      const resetWatchdog = () => {
        clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          if (active) setConnected(false);
        }, 5000);
      };

      ws.onopen = () => {
        if (active) {
          setConnected(true);
          resetWatchdog();
        }
      };

      ws.onclose = () => {
        if (active) {
          setConnected(false);
          clearTimeout(watchdogTimer);
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        if (!active) return;

        // If we were marked disconnected by watchdog, restore it
        setConnected(true);
        resetWatchdog();

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const blob = new Blob([event.data], { type: 'image/jpeg' });
        blobUrlRef.current = URL.createObjectURL(blob);
        if (imgRef.current) {
          imgRef.current.src = blobUrlRef.current;
        }
      };
    };

    connect();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      clearTimeout(watchdogTimer);
      if (ws) ws.close();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [cameraId, enabled]);

  return { imgRef, connected };
}
