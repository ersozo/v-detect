"""Tests for API key authentication middleware."""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


@pytest.fixture(autouse=True)
def _clear_api_key_env(monkeypatch):
    """Ensure VSAFE_API_KEY is cleared between tests."""
    monkeypatch.delenv("VSAFE_API_KEY", raising=False)


def test_no_api_key_allows_all():
    """When VSAFE_API_KEY is not set, all requests should pass."""
    os.environ.pop("VSAFE_API_KEY", None)
    import importlib
    import auth as auth_mod
    importlib.reload(auth_mod)
    assert auth_mod.API_KEY == ""


def test_check_ws_api_key_with_no_env():
    os.environ.pop("VSAFE_API_KEY", None)
    import importlib
    import auth as auth_mod
    importlib.reload(auth_mod)
    assert auth_mod.check_ws_api_key({}) is True


def test_check_ws_api_key_with_env(monkeypatch):
    monkeypatch.setenv("VSAFE_API_KEY", "test-secret")
    import importlib
    import auth as auth_mod
    importlib.reload(auth_mod)
    assert auth_mod.check_ws_api_key({"x-api-key": "test-secret"}) is True
    assert auth_mod.check_ws_api_key({"x-api-key": "wrong"}) is False
    assert auth_mod.check_ws_api_key({}) is False
