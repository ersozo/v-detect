import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import Toggle from '../common/Toggle';

export default function PlcConfigModal() {
  const {
    plcs,
    defaultPlcId,
    closePlcModal,
    addPlc,
    updatePlcInstance,
    deletePlcInstance,
    loadPlcConfig,
    theme
  } = useApp();

  const [selectedPlcId, setSelectedPlcId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    enabled: false,
    ip: '192.168.0.50',
    rack: 0,
    slot: 0,
    db_number: 0,
    lifebit_byte: 0,
    lifebit_bit: 0,
    person_byte: 0,
    person_bit: 0,
  });

  const [lastInitializedKey, setLastInitializedKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadPlcConfig();
  }, [loadPlcConfig]);

  // Set initial selection
  useEffect(() => {
    if (defaultPlcId && !selectedPlcId && !isAdding) {
      setSelectedPlcId(defaultPlcId);
    }
  }, [defaultPlcId, selectedPlcId, isAdding]);

  // Populate form when selection changes
  useEffect(() => {
    const currentKey = isAdding ? 'new' : selectedPlcId;

    // Only initialize if the "key" (ID or 'new' state) has actually changed
    if (currentKey !== lastInitializedKey) {
      if (isAdding) {
        setFormData({
          name: 'Yeni PLC',
          enabled: true,
          ip: '192.168.0.1',
          rack: 0,
          slot: 0,
          db_number: 0,
          lifebit_byte: 0,
          lifebit_bit: 0,
          person_byte: 0,
          person_bit: 0,
        });
        setLastInitializedKey('new');
      } else if (selectedPlcId && plcs[selectedPlcId]) {
        const plc = plcs[selectedPlcId];
        setFormData({
          name: plc.name || '',
          enabled: plc.enabled || false,
          ip: plc.ip || '192.168.0.1',
          rack: plc.rack ?? 0,
          slot: plc.slot ?? 0,
          db_number: plc.db_number ?? 0,
          lifebit_byte: plc.lifebit_byte ?? 0,
          lifebit_bit: plc.lifebit_bit ?? 0,
          person_byte: plc.person_byte ?? 0,
          person_bit: plc.person_bit ?? 0,
        });
        setLastInitializedKey(selectedPlcId);
      }
    }
  }, [selectedPlcId, plcs, isAdding, lastInitializedKey]);

  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : (value === '1' ? true : value === '0' ? false : value),
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let success;
    if (isAdding) {
      success = await addPlc(formData);
    } else {
      success = await updatePlcInstance(selectedPlcId, formData);
    }

    setSubmitting(false);
    if (success && isAdding) {
      setIsAdding(false);
    }
  }, [formData, isAdding, selectedPlcId, addPlc, updatePlcInstance]);

  const handleDelete = useCallback(async (id) => {
    if (confirm('Bu PLC bağlantısını silmek istediğinize emin misiniz?')) {
      const success = await deletePlcInstance(id);
      if (success && selectedPlcId === id) {
        setSelectedPlcId(Object.keys(plcs).find(k => k !== id) || null);
      }
    }
  }, [deletePlcInstance, plcs, selectedPlcId]);

  const plcList = Object.values(plcs);
  const selectedPlc = selectedPlcId ? plcs[selectedPlcId] : null;

  return (
    <Modal title="PLC Yönetimi" onClose={closePlcModal} className="max-w-5xl">
      <div className="flex flex-col md:flex-row gap-0 h-[500px] -m-6">
        {/* Sidebar: PLC List */}
        <div className="w-full md:w-80 flex flex-col border-r border-border-color bg-secondary/10">
          <div className="p-6 border-b border-border-color">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-themed-secondary uppercase tracking-widest">Cihazlar</h3>
              <button
                onClick={() => { setIsAdding(true); setSelectedPlcId(null); }}
                className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent hover:text-white transition-all shadow-sm"
                title="Yeni PLC Ekle"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {plcList.map(plc => (
              <div
                key={plc.id}
                onClick={() => { setSelectedPlcId(plc.id); setIsAdding(false); }}
                className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                  selectedPlcId === plc.id
                    ? 'bg-accent text-white border-accent shadow-md'
                    : 'bg-card hover:bg-secondary/50 text-themed border-border-color'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    plc.enabled
                      ? (plc.is_connected ? 'bg-green-400' : 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse')
                      : 'bg-themed-secondary/30'
                  }`}></div>
                  <span className="text-sm font-bold truncate">{plc.name || plc.ip}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(plc.id); }}
                  className={`${
                    selectedPlcId === plc.id
                      ? 'opacity-70 hover:opacity-100 hover:bg-white/20 text-white'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-danger/10 hover:text-danger text-themed-secondary'
                  } p-1.5 transition-all rounded-lg`}
                  title="Sil"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {plcList.length === 0 && !isAdding && (
              <div className="py-12 flex flex-col items-center justify-center opacity-40">
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs italic">Cihaz bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        {/* Form: Selected PLC Config */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {(selectedPlc || isAdding) ? (
            <form onSubmit={handleSubmit} key={selectedPlcId || 'new'}>
              <div className="space-y-4">
                <div className="flex items-start justify-between bg-card p-4 rounded-xl border border-border-color border-l-4 border-l-accent">
                  <div className="flex-1 mr-4">
                    <label className="block text-xs font-bold text-themed-secondary uppercase tracking-tight mb-1">Cihaz Adı</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-transparent text-lg font-bold text-themed focus:outline-none w-full"
                      placeholder="örn. Ana Panel PLC"
                    />
                  </div>
                  <Toggle
                    label="DURUM"
                    labelClassName="block text-xs font-bold text-themed-secondary uppercase tracking-tight mb-1"
                    enabled={formData.enabled}
                    onChange={(enabled) => setFormData(prev => ({ ...prev, enabled }))}
                    className="flex flex-col items-end gap-1"
                  />
                </div>

                {/* Connection Status Component */}
                {!isAdding && selectedPlc && (
                  <div className={`p-4 rounded-xl text-sm border flex items-center gap-3 transition-colors ${
                    selectedPlc.is_connected
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-danger/10 text-red-400 border-danger/20'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${selectedPlc.is_connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-danger animate-pulse'}`}></div>
                    <div>
                      <p className="font-semibold">{selectedPlc.is_connected ? 'Bağlantı Aktif' : 'Bağlantı Hatası'}</p>
                      <p className="text-xs opacity-80">{selectedPlc.ip} adresindeki PLC'ye {selectedPlc.is_connected ? 'başarıyla ulaşıldı.' : 'erişim sağlanamadı.'}</p>
                    </div>
                  </div>
                )}

                {/* Grid Layout for settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Network */}
                  <div className="bg-card/50 p-4 rounded-xl border border-border-color">
                    <h4 className="text-xs font-bold text-themed-secondary uppercase mb-3 flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                       Network & Adres
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">PLC IP Adresi</label>
                        <input type="text" name="ip" value={formData.ip} onChange={handleChange} className="input-field-sm" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">Rack</label>
                          <input type="number" name="rack" value={formData.rack} onChange={handleChange} className="input-field-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">Slot</label>
                          <input type="number" name="slot" value={formData.slot} onChange={handleChange} className="input-field-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">DB No</label>
                          <input type="number" name="db_number" value={formData.db_number} onChange={handleChange} className="input-field-sm" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signals */}
                  <div className="bg-card/50 p-4 rounded-xl border border-border-color">
                    <h4 className="text-xs font-bold text-themed-secondary uppercase mb-3 flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       Sinyal Eşleştirme
                    </h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">LIFEBIT BYTE</label>
                          <input type="number" name="lifebit_byte" value={formData.lifebit_byte} onChange={handleChange} className="input-field-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">BIT</label>
                          <input type="number" name="lifebit_bit" min="0" max="7" value={formData.lifebit_bit} onChange={handleChange} className="input-field-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">GENEL ALARM BYTE</label>
                          <input type="number" name="person_byte" value={formData.person_byte} onChange={handleChange} className="input-field-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-themed-secondary mb-1 uppercase tracking-tight">BIT</label>
                          <input type="number" name="person_bit" min="0" max="7" value={formData.person_bit} onChange={handleChange} className="input-field-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex justify-end gap-3 mt-4 border-t border-border-color">
                  {isAdding && (
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="btn-secondary px-6"
                    >
                      Vazgeç
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary min-w-[120px] justify-center"
                  >
                    {submitting ? 'İşleniyor...' : (isAdding ? 'Sisteme Ekle' : 'Güncelle')}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-card/10 rounded-2xl border-2 border-dashed border-border-color">
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h3 className="text-themed font-bold text-lg mb-2">PLC Seçilmedi</h3>
              <p className="text-themed-secondary max-w-xs text-sm">Ayarlarını düzenlemek için soldaki listeden bir PLC seçin veya yeni bir bağlantı oluşturun.</p>
              <button
                onClick={() => setIsAdding(true)}
                className="mt-6 btn-primary"
              >
                Yeni PLC Bağlantısı Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </Modal>
  );
}
