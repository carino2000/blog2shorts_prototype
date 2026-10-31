"""메모리 프로젝트 저장소 + 프로젝트 파일 경로. 서버가 재시작되면 사라진다(MVP 감수)."""

import asyncio
import re
import shutil
import time
import uuid
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from app.config import get_settings
from app.errors import AppError
from app.models import Asset, Project, Source

EXPIRE_SEC = 24 * 60 * 60
_PROJECT_FOLDER = re.compile(r"[0-9a-f]{12}")


@dataclass(frozen=True)
class ProjectPaths:
    root: Path

    @property
    def assets(self) -> Path:
        return self.root / "assets"

    @property
    def tts(self) -> Path:
        return self.root / "tts"

    @property
    def subs(self) -> Path:
        return self.root / "subs"

    @property
    def clips(self) -> Path:
        return self.root / "clips"

    @property
    def output(self) -> Path:
        return self.root / "output.mp4"

    def make_dirs(self) -> None:
        for folder in (self.assets, self.tts, self.subs, self.clips):
            folder.mkdir(parents=True, exist_ok=True)


class ProjectStore:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self._projects: dict[str, Project] = {}
        # /api/assets/{assetId}에 프로젝트 ID가 없으므로 asset ID는 전역에서 유일하고, 여기서 파일을 찾는다
        self._asset_files: dict[str, Path] = {}
        self._lock = asyncio.Lock()

    def paths(self, project_id: str) -> ProjectPaths:
        return ProjectPaths(self.data_dir / project_id)

    async def create(self, source: Source) -> Project:
        project = Project(
            id=uuid.uuid4().hex[:12],
            status="extracting",
            progress=None,
            error=None,
            source=source,
            assets=[],
            needs_upload=False,
            analysis=None,
            script=None,
            scenes=[],
            video=None,
            created_at=datetime.now(UTC).isoformat(timespec="seconds"),
        )
        async with self._lock:
            self._projects[project.id] = project
        return project.model_copy(deep=True)

    async def get(self, project_id: str) -> Project:
        async with self._lock:
            project = self._projects.get(project_id)
            if project is None:
                raise AppError("NOT_FOUND")
            return project.model_copy(deep=True)

    async def update(self, project_id: str, change: Callable[[Project], None]) -> Project:
        """잠금 안에서 프로젝트를 고친다. 바깥에서 받은 사본을 고쳐도 저장소에는 반영되지 않는다."""
        async with self._lock:
            project = self._projects.get(project_id)
            if project is None:
                raise AppError("NOT_FOUND")
            change(project)
            return project.model_copy(deep=True)

    @staticmethod
    def new_asset_id() -> str:
        return f"a{uuid.uuid4().hex[:10]}"

    async def add_asset(self, project_id: str, asset: Asset, file: Path) -> None:
        async with self._lock:
            project = self._projects.get(project_id)
            if project is None:
                raise AppError("NOT_FOUND")
            project.assets.append(asset)
            self._asset_files[asset.id] = file

    async def asset_file(self, asset_id: str) -> Path:
        async with self._lock:
            path = self._asset_files.get(asset_id)
        if path is None or not path.is_file():
            raise AppError("NOT_FOUND", "이미지를 찾을 수 없습니다.")
        return path

    async def purge_expired(self, max_age_sec: float = EXPIRE_SEC, now: float | None = None) -> list[str]:
        """오래된 프로젝트 폴더와 메모리 항목을 지운다. 이름이 프로젝트 ID 형태인 폴더만 대상이다."""
        current = time.time() if now is None else now
        expired = [
            folder for folder in await asyncio.to_thread(self._project_folders)
            if current - folder.stat().st_mtime > max_age_sec
        ]
        removed: list[str] = []
        for folder in expired:
            async with self._lock:
                project = self._projects.get(folder.name)
                if project is not None and project.status in ("extracting", "scripting", "rendering"):
                    continue
                self._projects.pop(folder.name, None)
                for asset_id in [key for key, file in self._asset_files.items() if file.is_relative_to(folder)]:
                    del self._asset_files[asset_id]
            await asyncio.to_thread(shutil.rmtree, folder, True)
            removed.append(folder.name)
        return removed

    def _project_folders(self) -> list[Path]:
        if not self.data_dir.is_dir():
            return []
        return [path for path in self.data_dir.iterdir() if path.is_dir() and _PROJECT_FOLDER.fullmatch(path.name)]


_store: ProjectStore | None = None


def get_store() -> ProjectStore:
    global _store
    if _store is None:
        _store = ProjectStore(get_settings().data_dir)
    return _store
