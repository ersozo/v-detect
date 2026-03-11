"""Tests for the SQLite event store."""

import time

from event_store import EventStore


def test_log_and_query(tmp_db):
    store = EventStore(tmp_db)
    ts = time.time()
    store.log("cam1", True, 2, ts)
    store.log("cam1", False, 0, ts + 1)
    store.log("cam2", True, 1, ts + 2)

    results = store.query()
    assert len(results) == 3
    assert results[0]["camera_id"] == "cam2"

    store.close()


def test_query_by_camera(tmp_db):
    store = EventStore(tmp_db)
    store.log("cam1", True, 1)
    store.log("cam2", True, 1)
    store.log("cam1", False, 0)

    results = store.query(camera_id="cam1")
    assert len(results) == 2
    assert all(r["camera_id"] == "cam1" for r in results)

    store.close()


def test_query_time_range(tmp_db):
    store = EventStore(tmp_db)
    base = 1000000.0
    store.log("cam1", True, 1, base)
    store.log("cam1", True, 2, base + 10)
    store.log("cam1", False, 0, base + 20)

    results = store.query(from_ts=base + 5, to_ts=base + 15)
    assert len(results) == 1
    assert results[0]["person_count"] == 2

    store.close()


def test_count(tmp_db):
    store = EventStore(tmp_db)
    for i in range(5):
        store.log("cam1", True, i)
    store.log("cam2", False, 0)

    assert store.count() == 6
    assert store.count(camera_id="cam1") == 5
    assert store.count(camera_id="cam2") == 1

    store.close()


def test_pagination(tmp_db):
    store = EventStore(tmp_db)
    for i in range(10):
        store.log("cam1", True, i, 1000.0 + i)

    page1 = store.query(limit=3, offset=0)
    page2 = store.query(limit=3, offset=3)
    assert len(page1) == 3
    assert len(page2) == 3
    assert page1[0]["timestamp"] > page2[0]["timestamp"]

    store.close()
