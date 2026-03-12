import { useEffect, useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useWebSocketStream } from '../../hooks/useWebSocketStream';
import { useWebRTCStream } from '../../hooks/useWebRTCStream';
import { useAlerts } from '../../hooks/useAlerts';

export default function FullscreenModal() {
  const { fullscreenCamera, closeFullscreen } = useApp();

  // Try WebRTC
  const { videoRef, connected: rtcConnected, error: rtcError, isVideoReady } = useWebRTCStream(fullscreenCamera?.id);

  // Fallback to WebSocket
  const [useFallback, setUseFallback] = useState(false);
  const { imgRef, connected: wsConnected } = useWebSocketStream(fullscreenCamera?.id, useFallback);
  const { activeAlerts } = useAlerts();

  const isAlerting = !!activeAlerts[fullscreenCamera?.id];
  const connected = rtcConnected || wsConnected;

  useEffect(() => {
    if (rtcError) {
      setUseFallback(true);
    }
  }, [rtcError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rtcConnected && !rtcError) setUseFallback(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [rtcConnected, rtcError]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeFullscreen();
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreenNative();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeFullscreen]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreenNative = useCallback(() => {
    const modal = document.getElementById('fullscreen-modal');
    if (!modal) return;
    if (!document.fullscreenElement) {
      modal.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  if (!fullscreenCamera) return null;

  return (
    <div id="fullscreen-modal" className={`fullscreen-modal active fixed inset-0 bg-black z-50 transition-all duration-300 ${isAlerting ? 'ring-[16px] ring-emerald-500/50 ring-inset shadow-[0_0_50px_rgba(16,185,129,0.5)]' : ''}`}>
      {/* Top Left Info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center space-x-3">
          <span className={`live-indicator ${connected ? 'bg-accent' : 'bg-gray-600'} text-white text-sm font-bold px-3 py-1 rounded-full flex items-center space-x-2`}>
            <span className={`w-2 h-2 ${connected ? 'bg-white' : 'bg-gray-400'} rounded-full`}></span>
            <span>{connected ? 'CANLI' : 'OFFLINE'}</span>
          </span>
          {isAlerting && (
            <span className="bg-emerald-600 text-white text-sm font-black px-3 py-1 rounded-full flex items-center space-x-1 animate-pulse shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="uppercase">{activeAlerts[fullscreenCamera?.id] || 'TESPİT'}</span>
            </span>
          )}
          <h2 className="text-white text-xl font-bold drop-shadow-lg">
            {fullscreenCamera.name}
          </h2>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <button
          onClick={toggleFullscreenNative}
          className="bg-slate-700/90 hover:bg-slate-600 text-white p-3 rounded-lg transition-colors"
          title="Tam Ekran (F)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={closeFullscreen}
          className="bg-slate-700/90 hover:bg-danger text-white p-3 rounded-lg transition-colors"
          title="Çıkış (ESC)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Video Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isVideoReady && !useFallback ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            ref={imgRef}
            alt={fullscreenCamera.name}
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Loading Overlay */}
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-400">Bağlanıyor…</p>
          </div>
        </div>
      )}

      {/* Bottom Left Shortcuts */}
      <div className="absolute bottom-4 left-4 z-10 text-slate-200 text-sm bg-slate-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
        <span><kbd className="bg-slate-600 px-2 py-1 rounded text-xs font-mono">ESC</kbd> Çıkış</span>
        <span className="mx-2">•</span>
        <span><kbd className="bg-slate-600 px-2 py-1 rounded text-xs font-mono">F</kbd> Tam Ekran</span>
      </div>

      {/* Bottom Right Camera Info */}
      <div className="absolute bottom-4 right-4 z-10">
        <span className="text-slate-200 text-sm bg-slate-800/80 px-3 py-2 rounded-lg backdrop-blur-sm">
          {fullscreenCamera.ip} | YOLO26-{fullscreenCamera.model_size || 'n'} | Güven: {fullscreenCamera.confidence || 0.5}
        </span>
      </div>
    </div>
  );
}
