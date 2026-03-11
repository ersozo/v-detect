"""Tests for the leaky queue mechanism used in camera_process."""

import multiprocessing
from queue import Empty

from camera_process import _put_leaky


def test_put_leaky_replaces_stale_item():
    q = multiprocessing.Queue(maxsize=1)
    _put_leaky(q, "first")
    _put_leaky(q, "second")
    assert q.get_nowait() == "second"


def test_put_leaky_into_empty_queue():
    q = multiprocessing.Queue(maxsize=1)
    _put_leaky(q, "only")
    assert q.get_nowait() == "only"


def test_put_leaky_queue_has_single_item():
    q = multiprocessing.Queue(maxsize=1)
    for i in range(10):
        _put_leaky(q, i)
    assert q.get_nowait() == 9
    with __import__("pytest").raises(Empty):
        q.get_nowait()
