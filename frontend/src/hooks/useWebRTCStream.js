import { useRef, useEffect, useState } from 'react';

/**
 * useWebRTCStream
 *
 * Attempts to establish a WebRTC connection with the backend for a specific camera.
 *
 * @param {string} cameraId
 * @returns {object} { videoRef, connected, error }
 */
export function useWebRTCStream(cameraId, enabled = true) {
  const videoRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const pcRef = useRef(null);

  // Attach stream to video element whenever it changes or element becomes available
  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;

      // Ensure muted and playsInline are set programmatically (more reliable)
      el.muted = true;
      el.playsInline = true;

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("WebRTC: Autoplay was prevented, waiting for user interaction:", error);
        });
      }

      return () => {
        // Cleanup if needed
      };
    }
  }, [stream, videoRef.current, cameraId]);

  useEffect(() => {
    if (!cameraId || !enabled) {
      setConnected(false);
      setStream(null);
      return;
    }

    let active = true;
    let pc = null;
    let watchdogTimer = null;

    const resetWatchdog = () => {
      clearTimeout(watchdogTimer);
      watchdogTimer = setTimeout(() => {
        if (active) setConnected(false);
      }, 5000);
    };

    async function start() {
      try {
        pc = new RTCPeerConnection({
          iceServers: []
        });
        pcRef.current = pc;

        // Create a transceiver for video only (recvonly)
        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.ontrack = (event) => {
          if (!active) return;
          const incomingStream = event.streams[0] || new MediaStream([event.track]);
          setStream(incomingStream);

          // Reset watchdog on traffic
          setConnected(true);
          resetWatchdog();
        };

        pc.onconnectionstatechange = () => {
          if (!active) return;
          if (pc.connectionState === 'connected') {
            // We wait for ontrack to set connected=true for real data confirmation
            setError(null);
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
            setConnected(false);
            clearTimeout(watchdogTimer);
          }
        };

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Wait for ICE gathering to complete
        await new Promise((resolve) => {
          if (pc.iceGatheringState === 'complete') {
            resolve();
          } else {
            function checkState() {
              if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', checkState);
                resolve();
              }
            }
            pc.addEventListener('icegatheringstatechange', checkState);
          }
        });

        if (!active) return;

        // Send offer to backend
        const response = await fetch(`/api/webrtc/offer/${cameraId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: pc.localDescription.sdp,
            type: pc.localDescription.type
          })
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const answer = await response.json();
        if (answer.error) {
          throw new Error(answer.error);
        }

        if (!active) return;

        // Set remote description (the answer)
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

      } catch (err) {
        console.warn(`WebRTC failed for camera ${cameraId}:`, err);
        if (active) {
          setError(err.message);
          setConnected(false);
        }
      }
    }

    start();

    return () => {
      active = false;
      clearTimeout(watchdogTimer);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [cameraId, enabled]);

  return { videoRef, connected, error, isVideoReady: !!stream };
}
