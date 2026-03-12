import { useCallback, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useWebSocketStream } from '../../hooks/useWebSocketStream';
import { useWebRTCStream } from '../../hooks/useWebRTCStream';
import { useAlerts } from '../../hooks/useAlerts';

export default function CameraCard({ camera }) {
  const { openEditCameraModal, openRoiModal, openFullscreen, deleteCamera } = useApp();

  // Try WebRTC first
  const { videoRef, connected: rtcConnected, error: rtcError, isVideoReady } = useWebRTCStream(camera.id);

  // Fallback to WebSocket if WebRTC fails or doesn't connect quickly
  const [useFallback, setUseFallback] = useState(false);
  const { imgRef, connected: wsConnected } = useWebSocketStream(camera.id, useFallback);

  const { activeAlerts } = useAlerts();
  const isAlerting = !!activeAlerts[camera.id];

  const connected = rtcConnected || wsConnected;

  useEffect(() => {
    if (rtcError) {
      console.warn(`WebRTC error for ${camera.id}, falling back to WS`, rtcError);
      setUseFallback(true);
    }
  }, [rtcError, camera.id]);

  // If WebRTC doesn't connect within 5 seconds, try fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rtcConnected && !rtcError) {
        setUseFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [rtcConnected, rtcError]);

  const zonesCount = camera.zones?.length || 0;
  const hasOldRoi = camera.roi && Array.isArray(camera.roi) && camera.roi.length >= 3;
  const totalAreas = zonesCount > 0 ? zonesCount : (hasOldRoi ? 1 : 0);
  const isConfigured = totalAreas > 0;

  const displayIp = camera.ip || 'Unknown IP';

  const handleDoubleClick = useCallback(() => {
    openFullscreen(camera);
  }, [camera, openFullscreen]);

  const handleEdit = useCallback((e) => {
    e.stopPropagation();
    openEditCameraModal(camera);
  }, [camera, openEditCameraModal]);

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation();
    if (confirm('Bu kamerayı silmek istediğinizden emin misiniz?')) {
      await deleteCamera(camera.id);
    }
  }, [camera.id, deleteCamera]);

  const handleRoi = useCallback(() => {
    openRoiModal(camera);
  }, [camera, openRoiModal]);

  const handleFullscreen = useCallback((e) => {
    e.stopPropagation();
    openFullscreen(camera);
  }, [camera, openFullscreen]);

  return (
    <div className={`card-glass rounded-2xl overflow-hidden camera-card transition-all duration-300 ${isAlerting ? 'ring-4 ring-emerald-500 ring-inset shadow-[0_0_20px_rgba(16,185,129,0.5)]' : ''}`}>
      {/* Video Preview */}
      <div
        className="relative cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <div className="w-full aspect-video bg-gray-900 relative">
          {isVideoReady && !useFallback ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <img
              ref={imgRef}
              alt={camera.name}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
          {!connected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <span className="text-gray-500 text-sm">Bağlanıyor…</span>
            </div>
          )}
        </div>

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          {isAlerting ? (
            <span className="bg-emerald-600 text-white text-xs font-black px-2 py-1 rounded-full flex items-center space-x-1 animate-pulse shadow-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="uppercase">{activeAlerts[camera.id] || 'TESPİT'}</span>
            </span>
          ) : (
            <span className={`live-indicator ${connected ? 'bg-accent' : 'bg-gray-600'} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1`}>
              <span className={`w-2 h-2 ${connected ? 'bg-white' : 'bg-gray-400'} rounded-full`}></span>
              <span>{connected ? 'CANLI' : 'OFFLINE'}</span>
            </span>
          )}
          {isConfigured && (
            <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
              <span>ROI ({totalAreas})</span>
            </span>
          )}
        </div>

        {/* Top Right Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center space-x-2">
          <button
            onClick={handleFullscreen}
            className="fullscreen-btn bg-gray-900/70 hover:bg-primary text-white p-2 rounded-lg transition-all"
            title="Tam Ekran"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <button
            onClick={handleEdit}
            className="fullscreen-btn bg-gray-900/70 hover:bg-primary text-white p-2 rounded-lg transition-all"
            title="Kamerayı Düzenle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="fullscreen-btn bg-gray-900/70 hover:bg-danger text-white p-2 rounded-lg transition-all"
            title="Kamerayı Sil"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Camera Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">{camera.name}</h3>
            <p className="text-xs text-gray-400 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {displayIp}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRoi}
            className={`flex-1 ${isConfigured ? 'bg-blue-600 hover:bg-primary' : 'bg-slate-600 hover:bg-slate-500'} text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            <span>{isConfigured ? 'Bölge Düzenle' : 'Bölge Seç'}</span>
          </button>
          <span className="text-xs text-gray-500">
            {camera.custom_model ? `Özel: ${camera.custom_model}` : `YOLO26-${camera.model_size || 'n'}`} | IDs: {(camera.detect_classes || [0]).join(',')}
          </span>
        </div>

        {isConfigured && (
          <div className="mt-2 text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
            Konfigüre Edilmiş Bölge: {totalAreas}
          </div>
        )}
      </div>
    </div>
  );
}
