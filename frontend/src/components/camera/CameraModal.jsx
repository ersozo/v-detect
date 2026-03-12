import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from '../common/Modal';
import Toggle from '../common/Toggle';

export default function CameraModal() {
  const {
    editingCamera,
    closeCameraModal,
    addCamera,
    updateCamera,
    plcs,
    theme
  } = useApp();

  const isEditing = !!editingCamera;

  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: 554,
    username: 'admin',
    password: '',
    stream_path: '',
    model_size: 'n',
    frame_skip: 3,
    confidence: 0.5,
    blur_faces: false,
    plc_outputs: [],
    detect_classes: '0',
    custom_model: '',
  });

  const [lastInitializedId, setLastInitializedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    const currentId = editingCamera?.id || 'new';

    if (editingCamera && currentId !== lastInitializedId) {
      setFormData({
        name: editingCamera.name || '',
        ip: editingCamera.ip || '',
        port: editingCamera.port || 554,
        username: editingCamera.username || '',
        password: editingCamera.password || '',
        stream_path: editingCamera.stream_path || '',
        model_size: editingCamera.model_size || 'n',
        frame_skip: editingCamera.frame_skip ?? 3,
        confidence: editingCamera.confidence ?? 0.5,
        blur_faces: editingCamera.blur_faces || false,
        plc_outputs: editingCamera.plc_outputs || [],
        detect_classes: (editingCamera.detect_classes || [0]).join(','),
        custom_model: editingCamera.custom_model || '',
      });
      setLastInitializedId(currentId);
    } else if (!editingCamera && lastInitializedId !== 'new') {
      // Clear for new camera
      setFormData({
        name: '',
        ip: '',
        port: 554,
        username: 'admin',
        password: '',
        stream_path: '',
        model_size: 'n',
        frame_skip: 3,
        confidence: 0.5,
        blur_faces: false,
        plc_outputs: [],
        detect_classes: '0',
        custom_model: '',
      });
      setLastInitializedId('new');
    }
  }, [editingCamera, lastInitializedId]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const cameraData = {
      id: isEditing ? editingCamera.id : `cam_${Date.now()}`,
      name: formData.name,
      ip: formData.ip,
      port: parseInt(formData.port) || 554,
      username: formData.username || '',
      password: formData.password || '',
      stream_path: formData.stream_path || '',
      model_size: formData.model_size,
      frame_skip: parseInt(formData.frame_skip) || 0,
      confidence: parseFloat(formData.confidence) || 0.5,
      blur_faces: formData.blur_faces === 'true' || formData.blur_faces === true,
      plc_outputs: formData.plc_outputs || [],
      detect_classes: formData.detect_classes.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
      custom_model: formData.custom_model || null,
      roi: null,
    };

    let success;
    if (isEditing) {
      success = await updateCamera(editingCamera.id, cameraData);
    } else {
      success = await addCamera(cameraData);
    }

    setSubmitting(false);
    if (success) {
      closeCameraModal();
    }
  }, [formData, isEditing, editingCamera, addCamera, updateCamera, closeCameraModal]);

  // Generate RTSP preview
  const rtspPreview = (() => {
    const ip = formData.ip || '192.168.0.x';
    const port = formData.port || 554;
    const username = formData.username || '';
    const password = formData.password || '';
    const streamPath = formData.stream_path || '';

    let auth = '';
    if (username && password) {
      auth = `${username}:${'•'.repeat(password.length)}@`;
    } else if (username) {
      auth = `${username}@`;
    }

    const path = streamPath.startsWith('/') ? streamPath : (streamPath ? '/' + streamPath : '');
    return `rtsp://${auth}${ip}:${port}${path}`;
  })();

  return (
    <Modal
      title={isEditing ? 'Kamera Konfigürasyonu' : 'Yeni Kamera Tanımlama'}
      onClose={closeCameraModal}
      wide={true}
      className="max-w-7xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-themed mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Kamera Ayarları
            </h3>
            <hr className="border-border-color mb-4 opacity-50" />

            <div className="border border-border-color rounded-lg p-4 bg-card space-y-4">
              {/* Camera Name */}
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Kamera Adı</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field-sm"
                  placeholder="örn., Kapı Makinası 5. İstasyon"
                />
              </div>

              {/* IP Camera Connection details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-themed-secondary mb-1">IP Adresi</label>
                  <input
                    type="text"
                    name="ip"
                    required
                    value={formData.ip}
                    onChange={handleChange}
                    className="input-field-sm"
                    placeholder="192.168.0.220"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">Port</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className="input-field-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">Kullanıcı</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input-field-sm"
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">Parola</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Akış (opsiyonel)</label>
                <input
                  type="text"
                  name="stream_path"
                  value={formData.stream_path}
                  onChange={handleChange}
                  className="input-field-sm"
                  placeholder="/stream1 or /cam/realmonitor"
                />
              </div>

              <div className="p-2 bg-secondary rounded text-sm text-themed-secondary font-mono break-all border border-border-color">
                {rtspPreview}
              </div>
            </div>
          </div>

          {/* Column 2: AI related settings */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-themed flex items-center">
              <svg className="w-4 h-4 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Yapay Zeka Ayarları
            </h3>
            <hr className="border-border-color mb-4 opacity-50" />

            <div className="border border-border-color rounded-lg p-4 bg-card space-y-4">
              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">YOLO26 Model Seçimi</label>
                <select
                  name="model_size"
                  value={formData.model_size}
                  onChange={handleChange}
                  style={{ colorScheme: theme }}
                  className="input-field-sm"
                >
                  <option value="n" className="bg-bg-themed text-themed">Nano (en hızlı)</option>
                  <option value="s" className="bg-bg-themed text-themed">Small</option>
                  <option value="m" className="bg-bg-themed text-themed">Medium</option>
                  <option value="l" className="bg-bg-themed text-themed">Large</option>
                  <option value="x" className="bg-bg-themed text-themed">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Özel Model (.pt)</label>
                <input
                  type="text"
                  name="custom_model"
                  value={formData.custom_model}
                  onChange={handleChange}
                  className="input-field-sm font-mono"
                  placeholder="örn: custom.pt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-themed-secondary mb-1">Algılanacak Sınıf ID'leri</label>
                <input
                  type="text"
                  name="detect_classes"
                  value={formData.detect_classes}
                  onChange={handleChange}
                  className="input-field-sm font-mono"
                  placeholder="örn: 0, 2, 7"
                />
                <p className="text-[10px] text-themed-secondary mt-1 italic">
                  COCO: 0=İnsan, 2=Araba, 15=Kedi
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">Kare Atlama</label>
                  <select
                    name="frame_skip"
                    value={formData.frame_skip}
                    onChange={handleChange}
                    style={{ colorScheme: theme }}
                    className="input-field-sm"
                  >
                    {[0, 1, 2, 3, 4, 5].map(v => (
                      <option key={v} value={v} className="bg-bg-themed text-themed">{v === 0 ? 'Yok' : `${v} kare`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-themed-secondary mb-1">Güven Eşiği</label>
                  <select
                    name="confidence"
                    value={formData.confidence}
                    onChange={handleChange}
                    style={{ colorScheme: theme }}
                    className="input-field-sm"
                  >
                    {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(v => (
                      <option key={v} value={v} className="bg-bg-themed text-themed">{v.toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Toggle
                label="Yüzleri Bulanıklaştır"
                description="Gizlilik için yüzleri gizle"
                enabled={formData.blur_faces === true || formData.blur_faces === 'true'}
                onChange={(enabled) => setFormData(prev => ({ ...prev, blur_faces: enabled }))}
              />
            </div>
          </div>

          {/* Column 3: PLC related fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-themed flex items-center">
                <svg className="w-4 h-4 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                PLC Ayarları
              </h3>
              <button
                type="button"
                onClick={() => {
                  const newOutputs = [...(formData.plc_outputs || [])];
                  const firstPlcId = Object.keys(plcs)[0] || '';
                  const defaultDb = plcs[firstPlcId]?.db_number ?? 0;
                  newOutputs.push({ plc_id: firstPlcId, db_number: defaultDb, byte_idx: 0, bit_idx: 0 });
                  setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                }}
                className="text-xs btn-primary py-1 px-2"
              >
                + Ekle
              </button>
            </div>
            <hr className="border-border-color mb-4 opacity-50" />

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {(formData.plc_outputs || []).map((output, index) => (
                <div key={index} className="p-3 rounded-lg border border-border-color space-y-2 bg-card">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-themed-secondary uppercase">Çıkış #{index + 1}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newOutputs = formData.plc_outputs.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                      }}
                      className="text-danger hover:text-red-400 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <select
                        value={output.plc_id}
                        style={{ colorScheme: theme }}
                        onChange={(e) => {
                          const newOutputs = [...formData.plc_outputs];
                          const plcId = e.target.value;
                          newOutputs[index].plc_id = plcId;
                          if (plcs[plcId]) newOutputs[index].db_number = plcs[plcId].db_number;
                          setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                        }}
                        className="input-field-sm text-xs"
                      >
                        {Object.values(plcs).map(p => (
                          <option key={p.id} value={p.id}>{p.name || p.ip}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-themed-secondary whitespace-nowrap uppercase">DB NO</span>
                      <input
                        type="number"
                        value={output.db_number}
                        onChange={(e) => {
                          const newOutputs = [...formData.plc_outputs];
                          newOutputs[index].db_number = parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                        }}
                        className="input-field-sm text-center w-full py-1"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-themed-secondary whitespace-nowrap">BYTE</span>
                      <input
                        type="number"
                        value={output.byte_idx}
                        onChange={(e) => {
                          const newOutputs = [...formData.plc_outputs];
                          newOutputs[index].byte_idx = parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                        }}
                        className="input-field-sm text-center w-full py-1"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-themed-secondary whitespace-nowrap">BIT</span>
                      <input
                        type="number"
                        min="0" max="7"
                        value={output.bit_idx}
                        onChange={(e) => {
                          const newOutputs = [...formData.plc_outputs];
                          newOutputs[index].bit_idx = parseInt(e.target.value);
                          setFormData(prev => ({ ...prev, plc_outputs: newOutputs }));
                        }}
                        className="input-field-sm text-center w-full py-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(formData.plc_outputs || []).length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border-color rounded-lg bg-card">
                  <p className="text-xs italic">Sinyal çıkışı yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            type="button"
            onClick={closeCameraModal}
            className="flex-1 btn-secondary py-3"
            disabled={submitting}
          >
            İptal
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary justify-center py-3"
            disabled={submitting}
          >
            {submitting ? 'Kaydediliyor...' : (isEditing ? 'Kaydet' : 'Kamera Ekle')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
