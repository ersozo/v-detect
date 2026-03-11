import { useApp } from '../../context/AppContext';
import ThemeToggle from '../common/ThemeToggle';

export default function Header() {
  const { openAddCameraModal, openPlcModal, currentView, navigateTo, plcConfig } = useApp();

  const getPlcStatusClass = () => {
    if (!plcConfig) return 'bg-slate-600 hover:bg-slate-500';
    if (!plcConfig.enabled) return 'bg-danger/50 hover:bg-danger/60'; // Dimmed red for disabled

    // If enabled, check connection health
    return plcConfig.is_connected ? 'bg-accent hover:opacity-90' : 'bg-danger animate-pulse'; // Pulsing red if connection lost
  };

  return (
    <header className="header-themed backdrop-blur-md border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Title */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => navigateTo('home')}
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-themed">VESTEL - Nesne Tespit</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {/* PLC Config Button */}
          <button
            onClick={openPlcModal}
            className={`${getPlcStatusClass()} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm`}
            title="PLC Ayarları"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">PLC</span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => navigateTo(currentView === 'reports' ? 'home' : 'reports')}
            className={`${currentView === 'reports' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-600 hover:bg-slate-500'} text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all`}
            title="Tespit Kayıtları"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{currentView === 'reports' ? 'Ana Sayfa' : 'Rapor'}</span>
          </button>

          {/* Add Camera Button */}
          <button
            onClick={openAddCameraModal}
            className="bg-blue-600 hover:bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Kamera Ekle</span>
          </button>
        </div>
      </div>
    </header>
  );
}
