import io
import itertools
from pathlib import Path

import httpx
import pytest
import respx
from PIL import Image

from app.errors import AppError
from app.pipeline import naver

FIXTURES = Path(__file__).parent / "fixtures" / "naver_html"
IMAGE_BASE = "https://mblogthumb-phinf.pstatic.net/x"


def _image_bytes(width: int, height: int, image_format: str = "JPEG") -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (10, 20, 30)).save(buffer, image_format)
    return buffer.getvalue()


def _ids():
    counter = itertools.count(1)
    return lambda: f"a{next(counter)}"


# ── URL 파싱: 허용 4종·거부 3종 (frontend naverUrl.ts와 같은 규칙) ──

@pytest.mark.parametrize("url", [
    "https://blog.naver.com/copper567/224453934072",
    "https://m.blog.naver.com/copper567/224453934072",
    "https://blog.naver.com/PostView.naver?blogId=copper567&logNo=224453934072",
    "blog.naver.com/PostView.nhn?blogId=copper567&logNo=224453934072",
])
def test_parse_naver_url_accepts(url: str) -> None:
    assert naver.parse_naver_url(url) == naver.NaverPost("copper567", "224453934072")


@pytest.mark.parametrize("url", [
    "https://naver.me/abcd1234",
    "https://blog.naver.com/copper567",
    "https://tistory.com/copper567/224453934072",
])
def test_parse_naver_url_rejects(url: str) -> None:
    with pytest.raises(AppError) as error:
        naver.parse_naver_url(url)
    assert error.value.code == "NOT_NAVER_URL"


def test_large_image_url_replaces_thumbnail_type() -> None:
    assert naver.large_image_url(f"{IMAGE_BASE}/a.jpg?type=w80_blur") == f"{IMAGE_BASE}/a.jpg?type=w966"


# ── HTML 파싱 (저장한 실제 글, 네트워크 없음) ──

def test_parse_quotation_headings_post() -> None:
    parsed = naver.parse_post_html((FIXTURES / "copper567_224453934072.html").read_text(encoding="utf-8"))
    assert parsed is not None
    assert parsed.title == "자동차정비기능사합격률｜필기시험 난이도와 합격 공부방법"
    assert parsed.blocks[0].type == "heading" and parsed.blocks[0].text == parsed.title
    headings = [block.text for block in parsed.blocks if block.type == "heading"]
    assert "１. 필기시험은 기본 개념부터 이해해보세요" in headings
    assert parsed.blocks[1].text.startswith("자동차 정비 분야에 관심이 있거나 관련 자격증")
    # 원문 순서: 첫 문단 두 개 뒤에 첫 이미지
    assert [block.type for block in parsed.blocks[:4]] == ["heading", "paragraph", "paragraph", "image"]
    assert parsed.skipped.get("sticker") == 2
    assert parsed.skipped.get("video") == 1
    for block in parsed.blocks:
        assert block.type == "image" or (block.text and "​" not in block.text)


def test_parse_section_title_post() -> None:
    parsed = naver.parse_post_html((FIXTURES / "copper567_224414634855.html").read_text(encoding="utf-8"))
    assert parsed is not None
    headings = [block.text for block in parsed.blocks if block.type == "heading"]
    assert "1. 지역농협시험, 어떻게 구성되나요?" in headings
    assert "5. 마무리하며" in headings
    assert sum(1 for block in parsed.blocks if block.type == "image") == 8  # 다운로드 규칙 적용 전


def test_parse_returns_none_without_container() -> None:
    assert naver.parse_post_html("<html><body><p>hi</p></body></html>") is None


def test_text_to_blocks_splits_on_blank_lines() -> None:
    text = "첫 문단 " * 30 + "\n\n" + "둘째\n문단 " * 20 + "\n   \n셋째"
    blocks = naver.text_to_blocks(text)
    assert [block.id for block in blocks] == ["b1", "b2", "b3"]
    assert all(block.type == "paragraph" for block in blocks)
    assert "\n" not in blocks[1].text


def test_text_to_blocks_too_short() -> None:
    with pytest.raises(AppError) as error:
        naver.text_to_blocks("짧은 글")
    assert error.value.code == "TEXT_TOO_SHORT"


# ── 네트워크 (respx로 가짜 응답) ──

@pytest.mark.asyncio
@respx.mock
async def test_fetch_post_404_is_post_not_found() -> None:
    respx.get(url__startswith="https://m.blog.naver.com/").respond(404)
    respx.get(url__startswith="https://blog.naver.com/PostView").respond(404)
    async with naver.new_client() as client:
        with pytest.raises(AppError) as error:
            await naver.fetch_post(client, naver.NaverPost("a", "1"))
    assert error.value.code == "POST_NOT_FOUND"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_post_without_body_is_extract_failed() -> None:
    respx.get(url__startswith="https://m.blog.naver.com/").respond(200, text="<html></html>")
    respx.get(url__startswith="https://blog.naver.com/PostView").respond(200, text="<html></html>")
    async with naver.new_client() as client:
        with pytest.raises(AppError) as error:
            await naver.fetch_post(client, naver.NaverPost("a", "1"))
    assert error.value.code == "EXTRACT_FAILED"


@pytest.mark.asyncio
@respx.mock
async def test_fetch_post_falls_back_to_post_view() -> None:
    html = (FIXTURES / "copper567_224453934072.html").read_text(encoding="utf-8")
    respx.get(url__startswith="https://m.blog.naver.com/").respond(500)
    respx.get(url__startswith="https://blog.naver.com/PostView").respond(200, text=html)
    async with naver.new_client() as client:
        _, parsed = await naver.fetch_post(client, naver.NaverPost("a", "1"))
    assert parsed.title


@pytest.mark.asyncio
@respx.mock
async def test_download_images_applies_rules(tmp_path: Path) -> None:
    respx.get(f"{IMAGE_BASE}/big.jpg?type=w966").respond(200, content=_image_bytes(966, 724))
    respx.get(f"{IMAGE_BASE}/small.png?type=w966").respond(200, content=_image_bytes(531, 177, "PNG"))
    respx.get(f"{IMAGE_BASE}/gone.jpg?type=w966").respond(404)
    respx.get(f"{IMAGE_BASE}/huge.jpg?type=w966").respond(200, content=b"0" * (naver.MAX_IMAGE_BYTES + 1))
    respx.get(f"{IMAGE_BASE}/notimage.jpg?type=w966").respond(200, content=b"hello")
    urls = [f"{IMAGE_BASE}/{name}?type=w80_blur" for name in ("big.jpg", "small.png", "gone.jpg", "huge.jpg", "notimage.jpg")]
    urls.append("https://tracker.example.com/pixel.php")

    async with naver.new_client() as client:
        saved, skipped = await naver.download_images(client, urls, tmp_path, _ids())

    assert list(saved) == [urls[0]]
    asset, path = saved[urls[0]]
    assert (asset.id, asset.width, asset.height, asset.url) == ("a1", 966, 724, "/api/assets/a1")
    assert path.is_file() and path.suffix == ".jpg"
    assert len(skipped) == 5
    assert any("200px 미만" in reason for reason in skipped)
    assert any("10MB 초과" in reason for reason in skipped)
    assert any("네이버 이미지 서버가 아님" in reason for reason in skipped)


@pytest.mark.asyncio
@respx.mock
async def test_download_images_max_count(tmp_path: Path) -> None:
    respx.get(url__startswith=IMAGE_BASE).respond(200, content=_image_bytes(300, 300))
    urls = [f"{IMAGE_BASE}/{index}.jpg" for index in range(naver.MAX_IMAGES + 3)]
    async with naver.new_client() as client:
        saved, skipped = await naver.download_images(client, urls, tmp_path, _ids())
    assert len(saved) == naver.MAX_IMAGES
    assert len(skipped) == 3


@pytest.mark.asyncio
@respx.mock
async def test_extract_builds_blocks_in_order(tmp_path: Path) -> None:
    html = (FIXTURES / "copper567_224453934072.html").read_text(encoding="utf-8")
    respx.get("https://m.blog.naver.com/copper567/224453934072").respond(200, text=html)
    respx.get(url__regex=r"https://mblogthumb-phinf\.pstatic\.net/.*").respond(200, content=_image_bytes(966, 724))

    async with naver.new_client() as client:
        result = await naver.extract(client, "https://blog.naver.com/copper567/224453934072", tmp_path, _ids())

    assert [block.id for block in result.blocks] == [f"b{index}" for index in range(1, len(result.blocks) + 1)]
    image_blocks = [block for block in result.blocks if block.type == "image"]
    assert len(image_blocks) == len(result.assets) == 7  # 외부 추적 이미지 1장 제외
    assert {block.asset_id for block in image_blocks} == {asset.id for asset, _ in result.assets}
    assert result.skipped_components == {"sticker": 2, "horizontalLine": 1, "video": 1}


@pytest.mark.external
@pytest.mark.asyncio
async def test_extract_real_post(tmp_path: Path) -> None:
    async with naver.new_client() as client:
        result = await naver.extract(client, "https://blog.naver.com/copper567/224453934072", tmp_path, _ids())
    assert result.title and result.assets
