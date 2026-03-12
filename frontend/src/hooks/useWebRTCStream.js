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

  // Attach stream to video element whenever it changes
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    // Avoid re-setting srcObject if it's already assigned (prevents "new load request" interruption)
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }

    // Ensure muted and playsInline are set (required for autoplay in most browsers)
    el.muted = true;
    el.playsInline = true;

    let isSubscribed = true;
    const playVideo = async () => {
      try {
        await el.play();
      } catch (err) {
        if (!isSubscribed) return;
        
        if (err.name === 'AbortError') {
          // This is often triggered by a new source being assigned; it's safe to ignore
          // as the subsequent effect trigger will handle the new stream.
        } else if (err.name === 'NotAllowedError') {
          console.warn("WebRTC: Autoplay was prevented. Waiting for user interaction.");
          // The browser usually allows play() if it's triggered by a user action.
        } else {
          console.error("WebRTC: Video play() failed:", err);
        }
      }
    };

    playVideo();

    return () => {
      isSubscribed = false;
    };
  }, [stream]);

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
        if (active) {
          setConnected(false);
          setStream(null);
        }
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
            setError(null);
          } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed' || pc.connectionState === 'disconnected') {
            setConnected(false);
            setStream(null);
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
          setStream(null);
        }
      }
    }

    start();

    return () => {
      active = false;
      clearTimeout(watchdogTimer);
      setStream(null);
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [cameraId, enabled]);

  return { videoRef, connected, error, isVideoReady: !!stream };
}
