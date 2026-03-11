"""Shared fixtures for V-Safe tests."""

import os
import sys

import pytest

# Add backend/ to sys.path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))


@pytest.fixture
def tmp_captures(tmp_path):
    """Provide a temporary captures directory."""
    captures = tmp_path / "captures"
    captures.mkdir()
    return str(captures)


@pytest.fixture
def tmp_db(tmp_path):
    """Provide a temporary SQLite database path."""
    return str(tmp_path / "test_events.db")
