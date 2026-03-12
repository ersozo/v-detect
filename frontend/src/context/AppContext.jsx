import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cameraApi, roiApi, plcApi, reportsApi, systemApi } from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Camera state
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' or 'reports'
  const [systemStatus, setSystemStatus] = useState('standby');

  // Modal state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [roiModalOpen, setRoiModalOpen] = useState(false);
  const [roiCamera, setRoiCamera] = useState(null);
  const [plcModalOpen, setPlcModalOpen] = useState(false);
  const [fullscreenCamera, setFullscreenCamera] = useState(null);

  // PLC state
  const [plcConfig, setPlcConfig] = useState(null); // Legacy (default PLC)
  const [plcs, setPlcs] = useState({}); // All PLC instances {id: {config}}
  const [defaultPlcId, setDefaultPlcId] = useState(null);

  // Alerts state (Shared across components)
  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState({}); // camera_id -> boolean

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load cameras (with retry on failure)
  const loadCameras = useCallback(async (retries = 3) => {
    try {
      setLoading(true);
      const data = await cameraApi.getAll();
      setCameras(data.cameras || []);
    } catch (error) {
      console.error('Error loading cameras:', error);
      if (retries > 0) {
        setTimeout(() => loadCameras(retries - 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Add camera
  const addCamera = useCallback(async (cameraData) => {
    try {
      const data = await cameraApi.add(cameraData);
      if (data.status === 'success') {
        setCameras(prev => [...prev, data.camera]);
        return true;
      }
    } catch (error) {
      console.error('Error adding camera:', error);
    }
    return false;
  }, []);

  // Update camera
  const updateCamera = useCallback(async (cameraId, cameraData) => {
    try {
      const data = await cameraApi.update(cameraId, cameraData);
      if (data.status === 'success') {
        setCameras(prev => prev.map(c => c.id === cameraId ? data.camera : c));
        return true;
      }
    } catch (error) {
      console.error('Error updating camera:', error);
    }
    return false;
  }, []);

  // Delete camera
  const deleteCamera = useCallback(async (cameraId) => {
    try {
      const data = await cameraApi.delete(cameraId);
      if (data.status === 'success') {
        setCameras(prev => prev.filter(c => c.id !== cameraId));
        return true;
      }
    } catch (error) {
      console.error('Error deleting camera:', error);
    }
    return false;
  }, []);

  // Update ROI
  const updateRoi = useCallback(async (cameraId, points) => {
    try {
      const data = await roiApi.update(cameraId, points);
      if (data.status === 'success') {
        setCameras(prev => prev.map(c =>
          c.id === cameraId ? { ...c, roi: data.roi } : c
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating ROI:', error);
    }
    return false;
  }, []);

  // Clear ROI
  const clearRoi = useCallback(async (cameraId) => {
    try {
      const data = await roiApi.clear(cameraId);
      if (data.status === 'success') {
        setCameras(prev => prev.map(c =>
          c.id === cameraId ? { ...c, roi: null } : c
        ));
        return true;
      }
    } catch (error) {
      console.error('Error clearing ROI:', error);
    }
    return false;
  }, []);

  // Update Zones
  const updateZones = useCallback(async (cameraId, zones) => {
    try {
      const data = await roiApi.updateZones(cameraId, zones);
      if (data.status === 'success') {
        setCameras(prev => prev.map(c =>
          c.id === cameraId ? { ...c, zones: data.zones, roi: null } : c
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating zones:', error);
    }
    return false;
  }, []);

  // Clear Zones
  const clearZones = useCallback(async (cameraId) => {
    try {
      const data = await roiApi.clearZones(cameraId);
      if (data.status === 'success') {
        setCameras(prev => prev.map(c =>
          c.id === cameraId ? { ...c, zones: null } : c
        ));
        return true;
      }
    } catch (error) {
      console.error('Error clearing zones:', error);
    }
    return false;
  }, []);

  // Load PLC config (All PLCs)
  const loadPlcConfig = useCallback(async () => {
    try {
      const data = await plcApi.getAll();
      setPlcs(data.instances || {});
      setDefaultPlcId(data.default_plc_id);

      // Update legacy plcConfig state with the default one
      if (data.default_plc_id && data.instances[data.default_plc_id]) {
        setPlcConfig(data.instances[data.default_plc_id]);
      } else {
        // Fallback for UI if no PLCs exist
        setPlcConfig(null);
      }
    } catch (error) {
      console.error('Error loading PLC config:', error);
    }
  }, []);

  // Update legacy PLC config
  const updatePlcConfig = useCallback(async (config) => {
    try {
      const data = await plcApi.updateConfig(config);
      if (data.status === 'success') {
        // Refresh all
        await loadPlcConfig();
        return true;
      }
    } catch (error) {
      console.error('Error updating PLC config:', error);
    }
    return false;
  }, [loadPlcConfig]);

  // Multi-PLC Actions
  const addPlc = useCallback(async (plcData) => {
    try {
      const data = await plcApi.add(plcData);
      if (data.status === 'success') {
        await loadPlcConfig();
        return true;
      }
    } catch (error) {
      console.error('Error adding PLC:', error);
    }
    return false;
  }, [loadPlcConfig]);

  const updatePlcInstance = useCallback(async (id, plcData) => {
    try {
      const data = await plcApi.update(id, plcData);
      if (data.status === 'success') {
        await loadPlcConfig();
        return true;
      }
    } catch (error) {
      console.error('Error updating PLC instance:', error);
    }
    return false;
  }, [loadPlcConfig]);

  const deletePlcInstance = useCallback(async (id) => {
    try {
      const data = await plcApi.delete(id);
      if (data.status === 'success') {
        await loadPlcConfig();
        return true;
      }
    } catch (error) {
      console.error('Error deleting PLC instance:', error);
    }
    return false;
  }, [loadPlcConfig]);

  // Reports
  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const data = await reportsApi.getAll();
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    try {
      const data = await reportsApi.delete(reportId);
      if (data.status === 'success') {
        setReports(prev => prev.filter(r => r.id !== reportId));
        return true;
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
    return false;
  }, []);

  const deleteAllReports = useCallback(async () => {
    try {
      const data = await reportsApi.deleteAll();
      if (data.status === 'success') {
        setReports([]);
        return true;
      }
    } catch (error) {
      console.error('Error deleting all reports:', error);
    }
    return false;
  }, []);

  const navigateTo = useCallback((view) => {
    setCurrentView(view);
    if (view === 'reports') {
      loadReports();
    }
  }, [loadReports]);

  // Global Alert WebSocket Handler
  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/alerts`;

      console.log('🔗 Connecting to Global Alerts WS:', wsUrl);
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data || !data.camera_id) return;

          const alertId = `${data.camera_id}-${data.timestamp || Date.now()}`;
          const newAlert = {
            ...data,
            id: alertId,
            receivedAt: Date.now()
          };

          setAlerts(prev => {
            if (prev.some(a => a.id === alertId)) return prev;
            return [newAlert, ...prev].slice(0, 10);
          });

          // Continuously track the real detection status per camera
          setActiveAlerts(prev => ({
            ...prev,
            [data.camera_id]: data.person_detected ? (data.label || 'Nesne') : false
          }));

          // Auto-remove after 6 seconds
          setTimeout(() => removeAlert(alertId), 6000);
        } catch (err) {
          console.error('Alert parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('⚠️ Alert WS Closed. Retrying...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error('❌ Alert WS Error:', e);
        ws.close();
      };
    };

    connect();
    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [removeAlert]);

  // Modal handlers
  const openAddCameraModal = useCallback(() => {
    setEditingCamera(null);
    setCameraModalOpen(true);
  }, []);

  const openEditCameraModal = useCallback((camera) => {
    setEditingCamera(camera);
    setCameraModalOpen(true);
  }, []);

  const closeCameraModal = useCallback(() => {
    setCameraModalOpen(false);
    setEditingCamera(null);
  }, []);

  const openRoiModal = useCallback((camera) => {
    setRoiCamera(camera);
    setRoiModalOpen(true);
  }, []);

  const closeRoiModal = useCallback(() => {
    setRoiModalOpen(false);
    setRoiCamera(null);
  }, []);

  const openPlcModal = useCallback(() => {
    setPlcModalOpen(true);
  }, []);

  const closePlcModal = useCallback(() => {
    setPlcModalOpen(false);
  }, []);

  const openFullscreen = useCallback((camera) => {
    setFullscreenCamera(camera);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenCamera(null);
    document.body.style.overflow = '';
  }, []);

  // Stats
  const stats = {
    activeCameras: cameras.length,
    roiConfigured: cameras.reduce((sum, c) => {
      const zonesCount = c.zones?.length || 0;
      const hasOldRoi = c.roi && Array.isArray(c.roi) && c.roi.length >= 3;
      return sum + (zonesCount > 0 ? zonesCount : (hasOldRoi ? 1 : 0));
    }, 0),
  };

  // Load initial data
  useEffect(() => {
    loadCameras();
    loadPlcConfig();
  }, [loadCameras, loadPlcConfig]);

  // Background polling for PLC status
  useEffect(() => {
    const plcInterval = setInterval(loadPlcConfig, 10000);
    return () => clearInterval(plcInterval);
  }, [loadPlcConfig]);

  // Background polling for system status
  useEffect(() => {
    const fetchStatus = async () => {
      const data = await systemApi.getHealth();
      setSystemStatus(data.system_status || 'offline');
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    // State
    cameras,
    loading,
    theme,
    plcConfig,
    stats,
    systemStatus,

    // Camera modal
    cameraModalOpen,
    editingCamera,
    openAddCameraModal,
    openEditCameraModal,
    closeCameraModal,

    // ROI modal
    roiModalOpen,
    roiCamera,
    openRoiModal,
    closeRoiModal,

    // PLC modal
    plcModalOpen,
    openPlcModal,
    closePlcModal,

    // Fullscreen
    fullscreenCamera,
    openFullscreen,
    closeFullscreen,

    // Actions
    toggleTheme,
    loadCameras,
    addCamera,
    updateCamera,
    deleteCamera,
    updateRoi,
    clearRoi,
    updateZones,
    clearZones,
    loadPlcConfig,
    updatePlcConfig,
    plcs,
    defaultPlcId,
    addPlc,
    updatePlcInstance,
    deletePlcInstance,

    // Navigation & Reports
    currentView,
    navigateTo,
    reports,
    reportsLoading,
    loadReports,
    deleteReport,
    deleteAllReports,

    // Shared Alerts
    alerts,
    activeAlerts,
    removeAlert,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
