"""단계 실행 순서·status/progress 갱신·오류 기록. 라우터는 이 모듈만 호출한다.

B2: ①~④는 아직 가짜 파이프라인이다(sleep 후 샘플 데이터). B6에서 실제 단계로 바꾼다.
"""

import asyncio
import logging

from PIL import Image, ImageDraw

from app.errors import AppError
from app.models import Analysis, Asset, Block, Progress, Project, ProjectError, Scene, Script, Stage
from app.store import ProjectStore

logger = logging.getLogger("blog2shorts")

# 가짜 단계 하나에 걸리는 시간(초). 테스트에서 0으로 바꾼다
FAKE_STEP_SEC = 1.5


def _set_progress(stage: Stage, percent: float, message: str):
    def change(project: Project) -> None:
        project.progress = Progress(stage=stage, percent=percent, message=message)
    return change


def _fail(stage: Stage, error: AppError):
    def change(project: Project) -> None:
        project.status = "error"
        project.progress = None
        project.error = ProjectError(stage=stage, code=error.code, message=error.message)
    return change


async def run_create(store: ProjectStore, project_id: str) -> None:
    """POST /projects 뒤 백그라운드: ① 추출 → ②~④ 대본·장면 → ready."""
    stage: Stage = "extract"
    try:
        await store.update(project_id, _set_progress("extract", 0, "블로그 글을 읽고 있어요"))
        await asyncio.sleep(FAKE_STEP_SEC)
        await _fake_extract(store, project_id)

        stage = "script"

        def to_scripting(project: Project) -> None:
            project.status = "scripting"
            project.progress = Progress(stage="script", percent=0, message="대본을 쓰고 있어요")
        await store.update(project_id, to_scripting)
        await asyncio.sleep(FAKE_STEP_SEC)

        await store.update(project_id, _fake_script)
    except AppError as error:
        logger.warning("프로젝트 %s %s 단계 실패: %s", project_id, stage, error.code)
        await store.update(project_id, _fail(stage, error))
    except Exception:
        logger.exception("프로젝트 %s %s 단계 예외", project_id, stage)
        code = "EXTRACT_FAILED" if stage == "extract" else "LLM_FAILED"
        await store.update(project_id, _fail(stage, AppError(code)))


# ── 가짜 파이프라인 (B6에서 제거) ──

_SAMPLE_IMAGES = [
    # (가로, 세로, 색) — 가로형·세로형·정사각형으로 렌더 맞춤을 확인할 수 있게
    (1200, 800, (231, 111, 81)),
    (800, 1200, (42, 157, 143)),
    (1000, 1000, (233, 196, 106)),
]


def _draw_sample(path, size: tuple[int, int], color: tuple[int, int, int], label: str) -> None:
    image = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(image)
    draw.rectangle([20, 20, size[0] - 20, size[1] - 20], outline=(255, 255, 255), width=8)
    draw.text((60, 60), label, fill=(255, 255, 255))
    image.save(path, "JPEG", quality=85)


async def _fake_extract(store: ProjectStore, project_id: str) -> None:
    paths = store.paths(project_id)
    await asyncio.to_thread(paths.make_dirs)
    asset_ids: list[str] = []
    for index, (width, height, color) in enumerate(_SAMPLE_IMAGES, start=1):
        asset_id = store.new_asset_id()
        file = paths.assets / f"{asset_id}.jpg"
        await asyncio.to_thread(_draw_sample, file, (width, height), color, f"sample {index} {width}x{height}")
        await store.add_asset(
            project_id,
            Asset(id=asset_id, origin="blog", url=f"/api/assets/{asset_id}", width=width, height=height),
            file,
        )
        asset_ids.append(asset_id)

    a1, a2, a3 = asset_ids
    blocks = [
        Block(id="b1", type="heading", text="성수동 골목 작은 빵집 방문기", asset_id=None, linked_block_ids=[]),
        Block(id="b2", type="paragraph", text="주말 오전 10시에 문을 여는 빵집인데, 오픈 20분 전부터 줄이 생겼어요.",
              asset_id=None, linked_block_ids=[]),
        Block(id="b3", type="image", text="가게 앞 줄", asset_id=a1, linked_block_ids=["b2", "b4"]),
        Block(id="b4", type="paragraph", text="대표 메뉴는 소금빵이고 하루 300개만 굽는다고 해요. 겉은 바삭하고 속은 버터 향이 진했어요.",
              asset_id=None, linked_block_ids=[]),
        Block(id="b5", type="image", text="소금빵", asset_id=a2, linked_block_ids=["b4", "b6"]),
        Block(id="b6", type="paragraph", text="두 번째로 고른 무화과 깜빠뉴는 새콤한 맛이 좋아서 커피와 잘 어울렸어요.",
              asset_id=None, linked_block_ids=[]),
        Block(id="b7", type="image", text="매장 내부", asset_id=a3, linked_block_ids=["b6", "b8"]),
        Block(id="b8", type="paragraph", text="좌석은 많지 않아서 포장해 가는 손님이 대부분이었어요. 근처에 가면 한 번 들러 보세요.",
              asset_id=None, linked_block_ids=[]),
    ]

    def fill(project: Project) -> None:
        project.source.title = "성수동 골목 작은 빵집 방문기"
        project.source.blocks = blocks
        project.needs_upload = False
        project.progress = Progress(stage="extract", percent=100, message="글을 다 읽었어요")
    await store.update(project_id, fill)


def _fake_script(project: Project) -> None:
    a1, a2, a3 = (asset.id for asset in project.assets[:3])
    scenes_data = [
        ("hook", "문 열기 20분 전부터 줄 서는 빵집, 대체 뭐가 있을까요?", a1, "zoom_in", ["b2"]),
        ("body", "성수동 골목의 이 빵집은 주말 오전 10시에 문을 열어요. 오픈 전부터 줄이 길게 생겨요.", a1, "pan_left", ["b2"]),
        ("body", "대표 메뉴는 소금빵. 하루 300개만 굽는데, 겉은 바삭하고 속은 버터 향이 진해요.", a2, "zoom_out", ["b4"]),
        ("body", "두 번째로 고른 무화과 깜빠뉴도 새콤한 맛이 좋아서, 커피와 함께 먹으니 정말 잘 어울렸어요.", a3, "pan_right", ["b6"]),
        ("cta", "좌석이 적어 포장 손님이 많아요. 근처에 가면 꼭 한 번 들러 보세요!", a3, "zoom_in", ["b8"]),
    ]
    project.scenes = [
        Scene(id=f"s{order}", order=order, role=role, text=text, asset_id=asset_id, motion=motion,
              source_block_ids=source, duration_sec=None, subtitles=[])
        for order, (role, text, asset_id, motion, source) in enumerate(scenes_data, start=1)
    ]
    total_chars = sum(len(scene.text) for scene in project.scenes)
    project.analysis = Analysis(
        summary="성수동 골목의 작은 빵집을 주말 오전에 방문한 후기다. 오픈 전부터 줄이 생기고, 하루 300개만 굽는 소금빵이 대표 메뉴다.",
        key_points=[
            "주말 오전 10시에 문을 열고, 오픈 20분 전부터 줄이 생긴다.",
            "대표 메뉴 소금빵은 하루 300개만 굽는다.",
            "무화과 깜빠뉴는 새콤해서 커피와 잘 어울린다.",
            "좌석이 적어 포장 손님이 대부분이다.",
        ],
    )
    project.script = Script(
        hook=project.scenes[0].text,
        body=" ".join(scene.text for scene in project.scenes[1:-1]),
        cta=project.scenes[-1].text,
        estimated_sec=round(total_chars / 7, 1),
    )
    project.status = "ready"
    project.progress = None
