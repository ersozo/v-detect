"""Tests for RTSPCapture connection test utility."""

from capture import RTSPCapture


def test_test_connection_invalid_url():
    result = RTSPCapture.test_connection("rtsp://invalid-host:554/stream", timeout=3.0)
    assert result["reachable"] is False
    assert result["frame_received"] is False
    assert result["width"] == 0
    assert result["height"] == 0


def test_test_connection_returns_dict_keys():
    result = RTSPCapture.test_connection("rtsp://0.0.0.0:1/x", timeout=1.0)
    expected_keys = {"reachable", "opened", "frame_received", "width", "height", "fps"}
    assert set(result.keys()) == expected_keys
