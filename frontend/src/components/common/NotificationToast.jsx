import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export default function NotificationToast({ alert, onDismiss }) {
  const { cameras } = useApp();

  const camera = cameras.find(c => c.id === alert.camera_id);
  const cameraName = camera ? camera.name : alert.camera_id;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isEntry = alert.person_detected;

  return (
    <div className={`
      pointer-events-auto w-80 overflow-hidden rounded-xl border backdrop-blur-md transition-all animate-slide-in-right
      ${isEntry
        ? 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        : 'bg-blue-500/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}
    `}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isEntry ? (
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-white uppercase tracking-wider">
              {isEntry ? `${alert.label || 'Nesne'} Tespit Edildi` : 'Bölge Temizlendi'}
            </p>
            <p className="mt-1 text-sm text-gray-300">
              <span className="font-semibold text-white">{cameraName}</span>: {isEntry ? `${alert.label || 'Nesne'} tespit edildi!` : 'Bölge temizlendi.'}
            </p>
            {isEntry && (
              <div className="mt-2 flex">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  Tespit Sayısı: {alert.count}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="inline-flex text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
