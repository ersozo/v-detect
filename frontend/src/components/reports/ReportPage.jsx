import { useApp } from '../../context/AppContext';
import { useState } from 'react';

const ReportPage = () => {
  const { reports, reportsLoading, loadReports, deleteReport, deleteAllReports } = useApp();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);

  const toggleSelection = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === reports.length && reports.length > 0) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleDelete = async (e, reportId) => {
    e.stopPropagation(); // Don't open the modal
    if (window.confirm('Bu resmi silmek istediğinize emin misiniz?')) {
      await deleteReport(reportId);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedReports.length === 0) return;

    if (window.confirm(`${selectedReports.length} kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      if (selectedReports.length === reports.length && reports.length > 1) {
        await deleteAllReports();
      } else {
        // Delete selected sequentially
        for (const id of selectedReports) {
          await deleteReport(id);
        }
      }
      setSelectedReports([]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-themed">Tespit Kayıtları</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="btn-secondary flex items-center gap-2"
            disabled={reportsLoading || reports.length === 0}
          >
            {selectedReports.length === reports.length && reports.length > 0 ? 'Tüm Seçimi Kaldır' : 'Tümünü Seç'}
          </button>
          {selectedReports.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="btn-danger flex items-center gap-2"
              disabled={reportsLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Sil ({selectedReports.length})
            </button>
          )}
          <button
            onClick={loadReports}
            className="btn-secondary flex items-center gap-2"
            disabled={reportsLoading}
          >
            {reportsLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Yenile
          </button>
        </div>
      </div>

      {reportsLoading && reports.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="spinner"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-themed-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Kayıt bulunamadı</h3>
          <p className="text-themed-muted">Şu ana kadar herhangi bir nesne tespiti kaydedilmedi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-card overflow-hidden cursor-pointer hover-scale group"
              onClick={() => setSelectedImage(report.image_url)}
            >
              <div className="aspect-video relative overflow-hidden bg-black/20">
                <img
                  src={report.image_url}
                  alt={`Tespit - ${formatDate(report.timestamp)}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
              <div className="p-4 bg-themed-card-header border-t border-themed-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-themed">
                  <div className="flex items-center gap-1.5 mr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      id={`select-${report.id}`}
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleSelection(report.id)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor={`select-${report.id}`} className="text-sm font-medium text-themed cursor-pointer select-none">
                      Seç
                    </label>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{formatDate(report.timestamp)}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, report.id)}
                  className="p-2 text-themed-muted hover:text-red-500 transition-colors"
                  title="Sil"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in zoom-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <button
              className="absolute -top-12 right-0 text-white hover:text-red-500 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Breach Detail"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
