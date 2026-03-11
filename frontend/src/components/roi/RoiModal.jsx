import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { cameraApi } from '../../services/api';
import RoiCanvas from './RoiCanvas';

export default function RoiModal() {
  const { roiCamera, closeRoiModal, updateZones, clearZones, loadCameras } = useApp();

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Zones list: { name, points, severity }
  const [zones, setZones] = useState([]);

  // Current polygon being drawn
  const [activePoints, setActivePoints] = useState([]);
  const [isClosed, setIsClosed] = useState(false);

  const [zoneName, setZoneName] = useState('');
  const [severity, setSeverity] = useState('warning');

  const imgRef = useRef(null);

  // Load existing zones when modal opens
  useEffect(() => {
    if (roiCamera?.zones && Array.isArray(roiCamera.zones)) {
      setZones(roiCamera.zones);
    } else if (roiCamera?.roi && Array.isArray(roiCamera.roi)) {
      // Migrate old ROI to a default zone
      setZones([{
        name: 'Ana Bolge',
        points: roiCamera.roi,
        severity: 'warning'
      }]);
    } else {
      setZones([]);
    }

    // Reset drawing state
    setActivePoints([]);
    setIsClosed(false);
    setZoneName(`Bolge ${ (roiCamera?.zones?.length || 0) + 1 }`);
  }, [roiCamera]);

  const handleImageLoad = useCallback((e) => {
    setImageDimensions({
      width: e.target.naturalWidth,
      height: e.target.naturalHeight,
    });
    setImageLoaded(true);
  }, []);

  const handlePointAdd = useCallback((point) => {
    if (isClosed) return;

    // Check if clicking near first point to close polygon
    if (activePoints.length >= 3) {
      const firstPoint = activePoints[0];
      const distance = Math.sqrt(
        Math.pow(point.x - firstPoint.x, 2) +
        Math.pow(point.y - firstPoint.y, 2)
      );

      if (distance < 15) {
        setIsClosed(true);
        return;
      }
    }

    setActivePoints(prev => [...prev, point]);
  }, [activePoints, isClosed]);

  const handleDoubleClick = useCallback(() => {
    if (activePoints.length >= 3 && !isClosed) {
      setIsClosed(true);
    }
  }, [activePoints, isClosed]);

  const handleAddZone = useCallback(() => {
    if (!isClosed || activePoints.length < 3) return;

    const newZone = {
      name: zoneName || `Bolge ${zones.length + 1}`,
      points: activePoints,
      severity: severity
    };

    setZones(prev => [...prev, newZone]);

    // Reset for next
    setActivePoints([]);
    setIsClosed(false);
    setZoneName(`Bolge ${zones.length + 2}`);
  }, [isClosed, activePoints, zoneName, severity, zones.length]);

  const removeZone = (index) => {
    setZones(prev => prev.filter((_, i) => i !== index));
  };

  const handleUndo = useCallback(() => {
    if (activePoints.length > 0) {
      setActivePoints(prev => prev.slice(0, -1));
      setIsClosed(false);
    }
  }, [activePoints]);

  const handleClearDrawing = useCallback(() => {
    setActivePoints([]);
    setIsClosed(false);
  }, []);

  const handleRemoveAll = useCallback(async () => {
    if (!roiCamera) return;
    if (confirm('Tüm bölgeleri kaldırmak istediğinizden emin misiniz?')) {
      const success = await clearZones(roiCamera.id);
      if (success) {
        setZones([]);
        await loadCameras();
      }
    }
  }, [roiCamera, clearZones, loadCameras]);

  const handleSave = useCallback(async () => {
    if (!roiCamera) return;

    // If there's an un-added drawing, prompt users to add it first or ignore
    if (activePoints.length > 0 && !isClosed) {
      if (!confirm('Çizimi tamamlamadınız. Sadece kaydedilmiş bölgeler sunucuya gönderilecektir. Devam edilsin mi?')) {
        return;
      }
    }

    if (zones.length === 0 && activePoints.length === 0) {
      if (!confirm('Hiç bölge tanımlanmadı. Var olan tüm bölgeler silinecek. Devam edilsin mi?')) {
        return;
      }
    }

    const success = await updateZones(roiCamera.id, zones);
    if (success) {
      await loadCameras();
      closeRoiModal();
    }
  }, [roiCamera, zones, activePoints, isClosed, updateZones, loadCameras, closeRoiModal]);

  if (!roiCamera) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card-glass rounded-2xl p-6 w-full max-w-6xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">Çoklu Bölge Yönetimi (ROI)</h2>
            <p className="text-sm text-gray-400">
              Kamera: {roiCamera.name}
            </p>
          </div>
          <button
            onClick={closeRoiModal}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
          {/* Main Content: Canvas */}
          <div className="flex-1 flex flex-col bg-black/40 rounded-xl border border-white/5 overflow-hidden">
            <div className="flex-1 relative flex justify-center items-center overflow-hidden bg-gray-900">
              <div className="relative">
                <img
                  ref={imgRef}
                  src={cameraApi.getFrameUrl(roiCamera.id)}
                  alt="Camera Frame"
                  className="max-w-full max-h-full block object-contain"
                  onLoad={handleImageLoad}
                />
                {imageLoaded && (
                  <RoiCanvas
                    width={imageDimensions.width}
                    height={imageDimensions.height}
                    zones={zones}
                    currentZone={{ points: activePoints, isClosed }}
                    onPointAdd={handlePointAdd}
                    onDoubleClick={handleDoubleClick}
                  />
                )}
              </div>
            </div>

            {/* Status Bar */}
            <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {activePoints.length === 0
                  ? 'Çizime başlamak için resme tıklayın'
                  : isClosed
                    ? 'Bölge tamamlandı, yan taraftan ekleyin'
                    : `Çiziliyor: ${activePoints.length} nokta (Kapatmak için ilk noktaya veya çift tıklayın)`}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleUndo}
                  disabled={activePoints.length === 0}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded disabled:opacity-50"
                >
                  Geri Al
                </button>
                <button
                  onClick={handleClearDrawing}
                  disabled={activePoints.length === 0}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded disabled:opacity-50"
                >
                  Temizle
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Zone List */}
          <div className="w-80 flex flex-col gap-4 flex-shrink-0">
            {/* Add Zone Controls */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <h3 className="text-sm font-semibold text-gray-300">Yeni Bölge Ekle</h3>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Bölge Adı</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-accent"
                  placeholder="Örn: Tespit Bölgesi"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400">Seviye</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                >
                  <option value="warning">Yeşil</option>
                  <option value="danger">Kırmızı</option>
                </select>
              </div>
              <button
                onClick={handleAddZone}
                disabled={!isClosed}
                className="w-full bg-accent hover:bg-accent/80 text-white text-sm py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Listeye Ekle
              </button>
            </div>

            {/* List of Zones */}
            <div className="flex-1 min-h-0 bg-white/5 rounded-xl border border-white/10 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-300">Tanımlı Bölgeler ({zones.length})</h3>
                {zones.length > 0 && (
                  <button onClick={handleRemoveAll} className="text-[10px] text-red-400 hover:text-red-300">Hepsini Sil</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {zones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs italic">
                    Henüz bölge eklenmedi.
                  </div>
                ) : (
                  zones.map((zone, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-2 flex items-center justify-between group">
                      <div className="flex items-center space-x-2 overflow-hidden">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.severity === 'danger' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]'}`}></div>
                        <div className="text-sm truncate font-medium text-gray-200">{zone.name}</div>
                      </div>
                      <button
                        onClick={() => removeZone(idx)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 mt-6 flex-shrink-0">
          <button
            onClick={closeRoiModal}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl transition-colors text-sm"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="bg-accent hover:bg-green-600 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg active:scale-95 text-sm"
          >
            Tüm Bölgeleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
