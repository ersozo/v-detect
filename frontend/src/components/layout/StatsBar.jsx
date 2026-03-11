import { useApp } from '../../context/AppContext';

export default function StatsBar() {
  const { stats, systemStatus } = useApp();

  const getStatusConfig = (status) => {
    switch (status) {
      case 'monitoring':
        return { label: 'Aktif İzleme', color: 'text-accent', bg: 'bg-accent/20' };
      case 'standby':
        return { label: 'Beklemede', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
      case 'offline':
        return { label: 'Çevrimdışı', color: 'text-red-500', bg: 'bg-red-500/20' };
      default:
        return { label: 'Online', color: 'text-accent', bg: 'bg-accent/20' };
    }
  };

  const statusConfig = getStatusConfig(systemStatus);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

      {/* System Status */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${statusConfig.bg} rounded-lg flex items-center justify-center`}>
            <svg className={`w-6 h-6 ${statusConfig.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-themed-secondary text-sm">Sistem Durumu</p>
            <p className={`text-2xl font-bold ${statusConfig.color}`}>{statusConfig.label}</p>
          </div>
        </div>
      </div>

      {/* Active Cameras */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-themed-secondary text-sm">Aktif Kameralar</p>
            <p className="text-2xl font-bold text-themed">{stats.activeCameras}</p>
          </div>
        </div>
      </div>

      {/* ROI Configured */}
      <div className="card-glass rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-themed-secondary text-sm">Seçili Bölge</p>
            <p className="text-2xl font-bold text-themed">{stats.roiConfigured}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
