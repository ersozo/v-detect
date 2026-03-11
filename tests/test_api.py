"""Integration tests for the FastAPI control plane.

Uses FastAPI TestClient to test API endpoints without starting
camera processes or PLC connections.
"""

import json
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


@pytest.fixture
def app_client(tmp_path, monkeypatch):
    """Create a test client with isolated temp directories."""
    cameras_db = tmp_path / "cameras_db.json"
    plc_config = tmp_path / "plc_config.json"
    captures_dir = tmp_path / "captures"
    events_db = tmp_path / "events.db"
    captures_dir.mkdir()

    monkeypatch.setattr("config.CAMERAS_DB_FILE", str(cameras_db))
    monkeypatch.setattr("config.PLC_CONFIG_FILE", str(plc_config))
    monkeypatch.setattr("config.CAPTURES_DIR", str(captures_dir))

    import importlib
    import main as main_mod

    main_mod.cameras = {}
    main_mod.event_store.close()

    from event_store import EventStore
    main_mod.event_store = EventStore(str(events_db))

    from fastapi.testclient import TestClient
    return TestClient(main_mod.app, raise_server_exceptions=False)


def test_get_cameras_empty(app_client):
    resp = app_client.get("/api/cameras")
    assert resp.status_code == 200
    data = resp.json()
    assert data["cameras"] == []


def test_get_plc_config(app_client):
    resp = app_client.get("/api/plc/config")
    assert resp.status_code == 200
    data = resp.json()
    assert "enabled" in data
    assert "ip" in data


def test_get_events_empty(app_client):
    resp = app_client.get("/api/events")
    assert resp.status_code == 200
    data = resp.json()
    assert data["events"] == []
    assert data["total"] == 0


def test_get_reports_empty(app_client):
    resp = app_client.get("/api/reports")
    assert resp.status_code == 200
    assert resp.json() == []


def test_delete_all_reports_empty(app_client):
    resp = app_client.delete("/api/reports")
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 0


def test_debug_pipeline_empty(app_client):
    resp = app_client.get("/api/debug/pipeline")
    assert resp.status_code == 200
    assert resp.json() == {}


def test_index_dev_mode(app_client):
    resp = app_client.get("/")
    assert resp.status_code == 200
    assert "Development Mode" in resp.text or "<!DOCTYPE html>" in resp.text


def test_delete_nonexistent_camera(app_client):
    resp = app_client.delete("/api/cameras/nonexistent")
    assert resp.status_code == 200
    assert resp.json()["status"] == "error"
