import os
import re
import time
from pathlib import Path
from typing import get_args

import pytest

from app.errors import DEFAULTS
from app.models import Asset, ErrorCode, Source
from app.store import EXPIRE_SEC, ProjectStore


def _age(folder: Path, seconds: float) -> None:
    moment = time.time() - seconds
    os.utime(folder, (moment, moment))


@pytest.mark.asyncio
async def test_purge_removes_only_old_project_folders(tmp_path: Path) -> None:
    store = ProjectStore(tmp_path)
    project = await store.create(Source(type="text", url=None, title=None, blocks=[]))
    old = store.paths(project.id)
    old.make_dirs()
    file = old.assets / "a1.jpg"
    file.write_bytes(b"x")
    await store.add_asset(project.id, Asset(id="a1", origin="upload", url="/x", width=1, height=1), file)
    # 진행 중 상태면 지우지 않는다
    assert project.status == "extracting"
    _age(old.root, EXPIRE_SEC + 10)
    assert await store.purge_expired() == []

    def finish(target) -> None:
        target.status = "ready"
    await store.update(project.id, finish)

    fresh = tmp_path / "aaaaaaaaaaaa"
    fresh.mkdir()
    other = tmp_path / "poc_render"
    other.mkdir()
    _age(other, EXPIRE_SEC + 10)

    assert await store.purge_expired() == [project.id]
    assert not old.root.exists()
    assert fresh.exists() and other.exists()
    with pytest.raises(Exception):
        await store.get(project.id)
    with pytest.raises(Exception):
        await store.asset_file("a1")


def test_every_error_code_has_korean_message() -> None:
    assert set(DEFAULTS) == set(get_args(ErrorCode))
    for status, message in DEFAULTS.values():
        assert 400 <= status < 600
        assert re.search(r"[가-힣]", message)
        assert "ffmpeg" not in message.lower()
