# V-Detect — System Architecture

## Overview

V-Detect is a real-time object detection and monitoring system for industrial environments.
It captures RTSP camera feeds, runs YOLO26 inference, enforces polygon ROI zones,
communicates with Siemens S7 PLCs, and streams annotated video to a React dashboard.

---

## Design Principles

| #   | Principle                             | Implementation                                                         |
| --- | ------------------------------------- | ---------------------------------------------------------------------- |
| 1   | **Streaming ≠ Detection ≠ PLC**       | Three independent layers with no cross-coupling                        |
| 2   | **Each camera = separate OS process** | `multiprocessing.Process` per camera for CPU isolation (no GIL)        |
| 3   | **Backlog-free**                      | Leaky queues (`maxsize=1`) — always latest frame, never stale          |
| 4   | **Multi-PLC & Many-to-Many**          | PLCManager drives multiple PLC connections via individual mappings     |
| 5   | **FastAPI = control plane only**      | Zero OpenCV / YOLO in the main process — only config, signaling, relay |

---

## System Diagram

```
                    ┌────────────────────┐
                    │     React UI       │
                    │   (WebRTC feed)    │
                    └─────────▲──────────┘
                              │ binary JPEG frames
                              │
                    ┌─────────┴──────────┐
                    │      FastAPI       │
                    │  - Config API      │
                    │  - WebRTC signaling│
                    │  - WS relay        │
                    │  - Health          │
                    └───────▲───────▲────┘
                            │       │
              control queue │       │ event queue
              (commands)    │       │ (detections)
                            │       │
        ┌───────────────────┘       └──────────────────┐
        │                                              │
 ┌──────┴─────────┐                             ┌──────┴─────────┐
 │ CameraProcess 1│                             │ CameraProcess N│
 │  ┌─ Capture    │     frame_queue             │  ┌─ Capture    │
 │  ├─ Detector   │───── (leaky) ────►  FastAPI │  ├─ Detector   │
 │  └─ Annotate   │                             │  └─ Annotate   │
 └──────▲─────────┘                             └──────▲─────────┘
        │                                              │
        └──────────────► Event Queue ◄─────────────────┘
                              │
                       ┌───────▼────────┐
                       │  PLC Manager   │
                       │ (Multi-Pool)   │
                       └───────┬────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
        ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
        │  PLC 1      │ │  PLC 2      │ │  PLC N      │
        └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Data Flow

### Frame Pipeline (per camera)

```
RTSP Camera
  │
  ▼  cv2.VideoCapture (TCP transport, buffer=1)
RTSPCapture.read()
  │
  ▼  YOLO26 inference (OpenVINO / PyTorch)
Detector.detect(frame, roi_polygon, roi_bbox)
  │  returns: [{ x1, y1, x2, y2, confidence, in_roi, label }, ...]
  │
  ▼  draw bounding boxes + ROI overlay + optional face blur
Annotate → cv2.imencode JPEG (75%)
  │
  ├──► frame_queue   (leaky, maxsize=1)  →  FastAPI frame pump  →  WebRTC tracks & WS clients
  │
  └──► event_queue   (leaky, maxsize=1)  →  PLC Manager  →  PLC
```

### Leaky Queue Semantics

```python
# Producer (camera process) — never blocks, always overwrites stale data
def put_leaky(queue, item):
    queue.get_nowait()   # discard old (ignore Empty)
    queue.put_nowait(item)

# Consumer (main process) — always reads the freshest item
frame = await run_in_executor(queue.get, timeout=0.5)
```

Result: zero frame backlog. If the consumer is slow, it skips to the latest frame.

---

## File Map

```
backend/
├── main.py               FastAPI app — routes, WebRTC signaling, WS relay, lifespan
├── models.py             Pydantic schemas (CameraConfig, PLCConfig, ROIZone, etc.)
├── config.py             Configuration manager - manages paths in data/ directory
├── auth.py               API-key middleware (optional, via VDETECT_API_KEY env var)
├── capture.py            RTSPCapture — cv2.VideoCapture wrapper + connection test
├── detector.py           Pure YOLO26 detector — frame in, detections out
├── camera_process.py     CameraProcess(multiprocessing.Process) — one per camera
├── process_manager.py    ProcessManager — lifecycle, IPC queues, health check
├── plc_client.py         Snap7 client (multi-instance connection pool)
├── plc_manager.py        PLCManager — Many-to-Many routing & aggregation
└── event_store.py        SQLite event store — handles database connections

data/                     Stateful files (excluded from Git, mounted in Docker)
├── cameras_db.json       Camera configurations (auto-saved)
├── plcs_db.json          Multi-PLC device definitions (auto-saved)
├── events.db             SQLite detection event log (WAL mode)
└── captures/             Detection snapshots (per-camera subdirectories)
    └── {camera_id}/      Timestamped JPEGs for each camera

frontend/
├── src/
│   ├── hooks/
│   │   ├── useWebRTCStream.js      Primary streaming hook — connects to WebRTC API
│   │   ├── useWebSocketStream.js   Fallback WS hook — binary JPEG → <img> blob URL
│   │   └── useAlerts.js            WS hook for /ws/alerts — detection state changes
│   ├── context/
│   │   └── AppContext.jsx          Global state — cameras, PLC, modals, theme
│   ├── services/
│   │   └── api.js                  REST client (cameras, events, reports, PLC)
│   └── components/
│       ├── camera/                 CameraCard, CameraGrid, CameraModal
│       ├── roi/                    RoiModal, RoiCanvas (polygon editor)
│       ├── plc/                    PlcConfigModal
│       ├── reports/                ReportPage (detection snapshots gallery)
│       ├── fullscreen/             FullscreenModal (WebRTC / WS fallback)
│       ├── layout/                 Header, StatsBar
│       └── common/                 Modal, EmptyState, ThemeToggle
└── vite.config.js                  Dev proxy: /api, /ws, /captures → :8000

deploy/
├── v-detect.service         systemd unit file
├── nginx-v-detect.conf      Nginx reverse proxy config
└── install.sh               Ubuntu deployment script

tests/
├── conftest.py             Shared fixtures (tmp dirs, db paths)
├── test_leaky_queue.py     Leaky queue unit tests
├── test_event_store.py     SQLite event store unit tests
├── test_capture.py         RTSP connection test utility tests
├── test_auth.py            API-key middleware tests
└── test_api.py             FastAPI endpoint integration tests
```

---

## Layer Details

### 1. Camera Process (`camera_process.py`)

Each camera runs in its own OS process, fully isolated from the main process and
other cameras. A single process handles the full pipeline for its camera:

- **Capture** → `RTSPCapture` opens the RTSP stream via OpenCV (TCP, buffer=1)
- **Detect** → `Detector.detect()` runs YOLO26 on the ROI-cropped frame
- **Annotate** → draws bounding boxes, ROI polygon overlay, optional face blur
- **Encode** → JPEG at 75% quality
- **Publish** → puts encoded frame + detection event into leaky queues

Control commands (set ROI, update confidence, get snapshot) arrive via a
`control_queue` and are processed non-blocking at the top of each loop iteration.

**Crash resilience**: if a camera process dies, `ProcessManager.health_check_loop()`
detects it within 10 seconds and restarts it automatically.

### 2. FastAPI Control Plane (`main.py`)

The main process has zero computer-vision code. It only:

| Responsibility    | Mechanism                                                                   |
| ----------------- | --------------------------------------------------------------------------- |
| Camera CRUD       | REST API → `cameras_db.json` + start/stop process                           |
| ROI management    | REST API → control queue command to camera process                          |
| PLC configuration | REST API → `plcs_db.json` + hot-reload PLCManager                           |
| Frame relay       | `frame_pump` task reads `mp.Queue` → fans out to WebRTC tracks & WS clients |
| Reports           | Serves saved detection JPEGs from root `data/captures/`                     |
| System Health     | `/api/health` shows aggregate dynamic status (Monitoring/Standby/Offline)   |
| Debug             | `/api/debug/pipeline` shows per-camera process + pump + client status       |

**Frame broadcast**: each WebRTC track and WebSocket client gets its own leaky queue.
The frame pump reads from the multiprocessing queue (in a thread pool) and writes
to all consumer queues. Slow clients skip frames automatically.

### 3. PLC Manager (`plc_manager.py`)

Runs as a single `asyncio` background task at 10 Hz:

1. Drains detection events from each camera's `event_queue`
2. Logs events to SQLite and broadcasts to `/ws/alerts`
3. Automatically manages a pool of **Multiple PLC Connections**
4. Supports **Many-to-Many** routing:
   - **PLC-side aggregation**: PLC config defines which cameras trigger its global state.
   - **Camera-side outputs**: Camera config can link to specific bits on multiple target PLCs.
5. Handles independent lifebits and connection monitoring for each PLC instance.

### 4. Detection (`detector.py`)

Pure inference module with no side effects:

- Loads YOLO26 model (OpenVINO preferred → PyTorch fallback)
- `detect(frame, roi_polygon, roi_bbox)` → list of detection dicts
- ROI cropping: runs inference only on the polygon bounding box (faster)
- ROI filtering: checks if detection center is inside the polygon
- Class filter: Supports all COCO classes (configurable per camera)

### 5. Frontend Streaming (`useWebRTCStream.js` & `useWebSocketStream.js`)

The UI attempts **WebRTC** primary streaming via `useWebRTCStream`. It exchanges an SDP offer with the backend `/api/webrtc/offer/{id}` directly. This provides native ultra-low latency video.

If WebRTC fails or times out, it gracefully falls back to **WebSocket** JPEG streaming:

```javascript
WebSocket binary frame (JPEG bytes)
  → new Blob([data], {type: 'image/jpeg'})
  → URL.createObjectURL(blob)
  → imgRef.current.src = blobUrl
  → URL.revokeObjectURL(previousUrl)
```

Auto-reconnects on disconnect. Shows appropriate badge based on WebRTC/WS connection state.

---

## API Reference

### Cameras
| Method | Path                           | Description                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| GET    | `/api/cameras`                 | List all cameras                                 |
| POST   | `/api/cameras`                 | Add camera (starts process)                      |
| POST   | `/api/cameras/test-connection` | Test RTSP connectivity (returns resolution, FPS) |
| PUT    | `/api/cameras/{id}`            | Update camera (hot-reload or restart)            |
| DELETE | `/api/cameras/{id}`            | Remove camera (stops process)                    |
| GET    | `/api/cameras/{id}/frame`      | Single JPEG snapshot (for ROI editor)            |
| PUT    | `/api/cameras/{id}/roi`        | Set polygon ROI                                  |
| DELETE | `/api/cameras/{id}/roi`        | Clear ROI                                        |
| PUT    | `/api/cameras/{id}/zones`      | Set multiple named ROI zones                     |
| DELETE | `/api/cameras/{id}/zones`      | Clear all zones                                  |

### Streaming
| Method | Path                     | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| POST   | `/api/webrtc/offer/{id}` | WebRTC SDP offer exchange               |
| WS     | `/ws/{id}`               | WebSocket binary JPEG stream (fallback) |
| WS     | `/ws/alerts`             | Detection state-change alerts (JSON)    |
| GET    | `/video/{id}`            | MJPEG fallback (backward compat)        |

### Events (audit trail)
| Method | Path          | Description                                                       |
| ------ | ------------- | ----------------------------------------------------------------- |
| GET    | `/api/events` | Query detection events (camera_id, from_ts, to_ts, limit, offset) |

### PLC (Multi-Instance)
| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/api/plcs`       | List all PLC instances + status      |
| POST   | `/api/plcs`       | Register a new PLC instance          |
| PUT    | `/api/plcs/{id}`  | Update specific PLC settings         |
| DELETE | `/api/plcs/{id}`  | Remove a PLC instance                |
| GET    | `/api/plc/config` | Legacy support (returns default PLC) |
| PUT    | `/api/plc/config` | Legacy support (updates default PLC) |

### Reports
| Method | Path                | Description                                               |
| ------ | ------------------- | --------------------------------------------------------- |
| GET    | `/api/reports`      | List detection snapshots (per-camera subdirectories)      |
| DELETE | `/api/reports/{id}` | Delete one snapshot (supports `camera_id/file.jpg` paths) |
| DELETE | `/api/reports`      | Delete all snapshots                                      |

### Debug
| Method | Path                  | Description                             |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/api/debug/pipeline` | Per-camera process, pump, client status |
| GET    | `/api/health`         | Aggregate dynamic system status         |

---

## Authentication

When the `VDETECT_API_KEY` environment variable is set, all `/api/*` routes
require an `X-API-Key` header. WebSocket, static, and frontend routes are
exempt so the UI can load without modification.

---

## Deployment

### Development

```bash
# Backend (from backend/ directory)
python main.py
# → Uvicorn on http://0.0.0.0:8000

# Frontend (from frontend/ directory)
npm run dev
# → Vite on http://localhost:3000 (proxies /api, /ws to :8000)
```

### Docker

```bash
docker compose up --build
# → http://localhost:8000
```

### Ubuntu (systemd)

```bash
sudo bash deploy/install.sh
sudo systemctl start v-detect
journalctl -u v-detect -f
```

### Nginx (production)

```bash
sudo cp deploy/nginx-v-detect.conf /etc/nginx/sites-available/v-detect
sudo ln -s /etc/nginx/sites-available/v-detect /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

### Testing

```bash
pip install pytest httpx
pytest tests/ -v
```

### Dependencies

- **Python**: FastAPI, Uvicorn, aiortc, Ultralytics (YOLO26), OpenCV, OpenVINO, NumPy, Pydantic, python-snap7
- **Node**: React 18, Vite, Tailwind CSS
- **Test**: pytest, httpx
