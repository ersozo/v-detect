/**
 * API Service for Safety Detection System
 * Handles all communication with the FastAPI backend
 */

const API_BASE = '';

/**
 * Camera API endpoints
 */
export const cameraApi = {
  /**
   * Get all cameras
   * @returns {Promise<{cameras: Array}>}
   */
  async getAll() {
    const response = await fetch(`${API_BASE}/api/cameras`);
    return response.json();
  },

  /**
   * Add a new camera
   * @param {Object} cameraData - Camera configuration
   * @returns {Promise<{status: string, camera: Object}>}
   */
  async add(cameraData) {
    const response = await fetch(`${API_BASE}/api/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cameraData),
    });
    return response.json();
  },

  /**
   * Update an existing camera
   * @param {string} cameraId - Camera ID
   * @param {Object} cameraData - Updated camera configuration
   * @returns {Promise<{status: string, camera: Object}>}
   */
  async update(cameraId, cameraData) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cameraData),
    });
    return response.json();
  },

  /**
   * Delete a camera
   * @param {string} cameraId - Camera ID
   * @returns {Promise<{status: string}>}
   */
  async delete(cameraId) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * Get a single frame for ROI selection
   * @param {string} cameraId - Camera ID
   * @returns {string} Frame URL with cache buster
   */
  getFrameUrl(cameraId) {
    return `${API_BASE}/api/cameras/${cameraId}/frame?t=${Date.now()}`;
  },

  /**
   * Get video feed URL
   * @param {string} cameraId - Camera ID
   * @returns {string} MJPEG stream URL
   */
  getVideoUrl(cameraId) {
    return `${API_BASE}/video/${cameraId}?t=${Date.now()}`;
  },

  /**
   * Test RTSP connection for a camera config
   * @param {Object} cameraData - Camera configuration to test
   * @returns {Promise<{status: string, reachable: boolean, width: number, height: number, fps: number}>}
   */
  async testConnection(cameraData) {
    const response = await fetch(`${API_BASE}/api/cameras/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cameraData),
    });
    return response.json();
  },
};

/**
 * ROI API endpoints
 */
export const roiApi = {
  /**
   * Update camera ROI
   * @param {string} cameraId - Camera ID
   * @param {Array<{x: number, y: number}>} points - Polygon points
   * @returns {Promise<{status: string, roi: Array}>}
   */
  async update(cameraId, points) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}/roi`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: cameraId,
        points: points,
      }),
    });
    return response.json();
  },

  /**
   * Clear camera ROI
   * @param {string} cameraId - Camera ID
   * @returns {Promise<{status: string}>}
   */
  async clear(cameraId) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}/roi`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * Update multi-zone ROI
   * @param {string} cameraId - Camera ID
   * @param {Array<Object>} zones - List of zone objects {name, points, severity}
   * @returns {Promise<{status: string, zones: Array}>}
   */
  async updateZones(cameraId, zones) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}/zones`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        camera_id: cameraId,
        zones: zones,
      }),
    });
    return response.json();
  },

  /**
   * Clear all zones
   * @param {string} cameraId - Camera ID
   * @returns {Promise<{status: string}>}
   */
  async clearZones(cameraId) {
    const response = await fetch(`${API_BASE}/api/cameras/${cameraId}/zones`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

/**
 * PLC API endpoints
 */
export const plcApi = {
  /**
   * Get all PLC instances
   * @returns {Promise<Object>}
   */
  async getAll() {
    const response = await fetch(`${API_BASE}/api/plcs`);
    return response.json();
  },

  /**
   * Get default PLC configuration (legacy)
   * @returns {Promise<Object>}
   */
  async getConfig() {
    const response = await fetch(`${API_BASE}/api/plc/config`);
    return response.json();
  },

  /**
   * Update default PLC configuration (legacy)
   * @param {Object} config - PLC configuration
   * @returns {Promise<{status: string, config: Object}>}
   */
  async updateConfig(config) {
    const response = await fetch(`${API_BASE}/api/plc/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  /**
   * Add a new PLC instance
   * @param {Object} instance - PLC configuration
   * @returns {Promise<{status: string, id: string}>}
   */
  async add(instance) {
    const response = await fetch(`${API_BASE}/api/plcs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(instance),
    });
    return response.json();
  },

  /**
   * Update a specific PLC instance
   * @param {string} id - PLC ID
   * @param {Object} instance - Updated configuration
   * @returns {Promise<{status: string}>}
   */
  async update(id, instance) {
    const response = await fetch(`${API_BASE}/api/plcs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(instance),
    });
    return response.json();
  },

  /**
   * Delete a PLC instance
   * @param {string} id - PLC ID
   * @returns {Promise<{status: string}>}
   */
  async delete(id) {
    const response = await fetch(`${API_BASE}/api/plcs/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

/**
 * Events API endpoints (audit trail)
 */
export const eventsApi = {
  /**
   * Query detection events
   * @param {Object} params - Query parameters
   * @returns {Promise<{events: Array, total: number}>}
   */
  async query(params = {}) {
    const qs = new URLSearchParams();
    if (params.camera_id) qs.set('camera_id', params.camera_id);
    if (params.from_ts) qs.set('from_ts', params.from_ts);
    if (params.to_ts) qs.set('to_ts', params.to_ts);
    if (params.limit) qs.set('limit', params.limit);
    if (params.offset) qs.set('offset', params.offset);
    const response = await fetch(`${API_BASE}/api/events?${qs}`);
    return response.json();
  },
};

/**
 * Reports API endpoints
 */
export const reportsApi = {
  /**
   * Get all safety breach reports
   * @returns {Promise<Array>}
   */
  async getAll() {
    const response = await fetch(`${API_BASE}/api/reports`);
    return response.json();
  },

  /**
   * Delete a specific safety breach report
   * @param {string} reportId - Filename/ID of the report
   * @returns {Promise<{status: string}>}
   */
  async delete(reportId) {
    const response = await fetch(`${API_BASE}/api/reports/${reportId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * Delete all safety breach reports
   * @returns {Promise<{status: string}>}
   */
  async deleteAll() {
    const response = await fetch(`${API_BASE}/api/reports`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

/**
 * System API endpoints
 */
export const systemApi = {
  /**
   * Get system health and status
   * @returns {Promise<{system_status: string, active_cameras: number, total_cameras: number}>}
   */
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    } catch (error) {
      return { system_status: 'offline', active_cameras: 0, total_cameras: 0 };
    }
  },
};
