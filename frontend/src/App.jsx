import Header from './components/layout/Header';
import StatsBar from './components/layout/StatsBar';
import CameraGrid from './components/camera/CameraGrid';
import EmptyState from './components/common/EmptyState';
import CameraModal from './components/camera/CameraModal';
import RoiModal from './components/roi/RoiModal';
import PlcConfigModal from './components/plc/PlcConfigModal';
import FullscreenModal from './components/fullscreen/FullscreenModal';
import ReportPage from './components/reports/ReportPage';
import AlertContainer from './components/layout/AlertContainer';
import { useApp } from './context/AppContext';

function App() {
  const {
    cameras,
    loading,
    cameraModalOpen,
    roiModalOpen,
    plcModalOpen,
    fullscreenCamera,
    currentView
  } = useApp();

  return (
    <div className="gradient-bg min-h-screen text-themed">
      <Header />
      <AlertContainer />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <StatsBar />

        {currentView === 'reports' ? (
          <ReportPage />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : cameras.length > 0 ? (
          <CameraGrid />
        ) : (
          <EmptyState />
        )}
      </main>

      {/* Modals */}
      {cameraModalOpen && <CameraModal />}
      {roiModalOpen && <RoiModal />}
      {plcModalOpen && <PlcConfigModal />}
      {fullscreenCamera && <FullscreenModal />}
    </div>
  );
}

export default App;
