import { useApp } from '../../context/AppContext';

export default function EmptyState() {
  const { openAddCameraModal } = useApp();

  return (
    <div className="card-glass rounded-2xl p-12 text-center">
      <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-themed">Tanımlı Kamera Yok</h3>
      <p className="text-themed-secondary mb-6">IP kamera ekleyin</p>
      <button
        onClick={openAddCameraModal}
        className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Kamera Ekle</span>
      </button>
    </div>
  );
}
