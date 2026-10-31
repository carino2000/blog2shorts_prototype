"""① 네이버 블로그 URL 파싱·글 가져오기·구조 추출·이미지 다운로드.

확인(2026-10-29, copper567 글 19건): 모바일 주소(m.blog.naver.com/{id}/{logNo})가 본문을 정적 HTML로 준다.
이미지는 Referer 없이도 받아지고 `?type=w966`이 가장 큰 표준 크기다. 없는 글은 404, 없는 블로그는 200 + 빈 화면.
"""

import asyncio
import io
import logging
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx
from bs4 import BeautifulSoup, Tag
from PIL import Image

from app.errors import AppError
from app.models import Asset, Block

logger = logging.getLogger("blog2shorts")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)
REFERER = "https://blog.naver.com/"

MAX_IMAGES = 20
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MIN_IMAGE_SIDE = 200
MIN_TEXT_CHARS = 200
# 인용구가 이 길이 이하면 소제목으로 본다(이 블로그는 인용구를 소제목으로 씀) 🟡
QUOTE_HEADING_MAX_CHARS = 40
# 본문 이미지 서버만 내려받는다. 글에 섞인 외부 추적 이미지 등은 받지 않는다
IMAGE_HOST_SUFFIX = ".pstatic.net"

_HOSTS = {"blog.naver.com", "m.blog.naver.com"}
_BLOG_ID = re.compile(r"^[A-Za-z0-9_-]+$")
_LOG_NO = re.compile(r"^\d+$")
_BLANK = re.compile(r"^[\s​﻿]*$")


@dataclass(frozen=True)
class NaverPost:
    blog_id: str
    log_no: str

    @property
    def mobile_url(self) -> str:
        return f"https://m.blog.naver.com/{self.blog_id}/{self.log_no}"

    @property
    def post_view_url(self) -> str:
        return f"https://blog.naver.com/PostView.naver?blogId={self.blog_id}&logNo={self.log_no}"


@dataclass
class RawBlock:
    type: Literal["heading", "paragraph", "image"]
    text: str | None = None
    image_url: str | None = None


@dataclass
class ParsedPost:
    title: str | None
    blocks: list[RawBlock]
    skipped: dict[str, int] = field(default_factory=dict)  # 건너뛴 컴포넌트 종류별 개수


@dataclass
class ExtractResult:
    title: str | None
    blocks: list[Block]
    assets: list[tuple[Asset, Path]]
    skipped_images: list[str]  # 받지 않은 이미지와 이유 (보고·디버깅용)
    skipped_components: dict[str, int] = field(default_factory=dict)


# ── URL ──

def parse_naver_url(raw: str) -> NaverPost:
    """허용 형태는 frontend/src/lib/naverUrl.ts와 같다."""
    text = raw.strip()
    if not re.match(r"^[a-z][a-z0-9+.-]*://", text, re.IGNORECASE):
        text = f"https://{text}"
    try:
        url = urlsplit(text)
    except ValueError:
        raise AppError("NOT_NAVER_URL") from None
    if url.scheme not in ("http", "https") or (url.hostname or "").lower() not in _HOSTS:
        raise AppError("NOT_NAVER_URL")

    segments = [segment for segment in url.path.split("/") if segment]
    if len(segments) == 1 and re.fullmatch(r"PostView\.(naver|nhn)", segments[0], re.IGNORECASE):
        query = dict(parse_qsl(url.query))
        blog_id, log_no = query.get("blogId", ""), query.get("logNo", "")
    elif len(segments) == 2:
        blog_id, log_no = segments
    else:
        raise AppError("NOT_NAVER_URL")
    if not (_BLOG_ID.match(blog_id) and _LOG_NO.match(log_no)):
        raise AppError("NOT_NAVER_URL")
    return NaverPost(blog_id, log_no)


def large_image_url(url: str) -> str:
    """썸네일 파라미터(?type=w80_blur 등)를 큰 크기로 바꾼다."""
    parts = urlsplit(url)
    query = [(key, value) for key, value in parse_qsl(parts.query) if key != "type"]
    query.append(("type", "w966"))
    return urlunsplit(parts._replace(query=urlencode(query)))


# ── HTML → 블록 ──

def _lines_to_paragraphs(lines: list[str]) -> list[str]:
    """빈 줄을 경계로 나누고, 한 덩어리 안의 줄바꿈은 공백으로 잇는다."""
    paragraphs: list[str] = []
    current: list[str] = []
    for line in lines:
        if _BLANK.match(line):
            if current:
                paragraphs.append(" ".join(current))
                current = []
        else:
            current.append(line.strip().replace("​", ""))
    if current:
        paragraphs.append(" ".join(current))
    return paragraphs


def _component_kind(component: Tag) -> str:
    for cls in component.get("class", []):
        if cls.startswith("se-") and cls not in ("se-component", "se-l-default") and not cls.startswith("se-l-"):
            return cls.removeprefix("se-")
    return "unknown"


def _image_urls(component: Tag) -> list[str]:
    urls = []
    for img in component.select("img.se-image-resource, img"):
        src = img.get("data-lazy-src") or img.get("src")
        if src and src.startswith("http"):
            urls.append(src)
    return list(dict.fromkeys(urls))


def _parse_smart_editor(container: Tag) -> ParsedPost:
    title: str | None = None
    blocks: list[RawBlock] = []
    skipped: dict[str, int] = {}

    for component in container.select(".se-component"):
        kind = _component_kind(component)
        if kind == "documentTitle":
            title_tag = component.select_one(".se-title-text") or component
            title = title_tag.get_text(" ", strip=True) or None
            if title:
                blocks.append(RawBlock("heading", title))
        elif kind == "sectionTitle":
            text = component.get_text(" ", strip=True)
            if text:
                blocks.append(RawBlock("heading", text))
        elif kind == "text":
            lines = [p.get_text() for p in component.select(".se-text-paragraph")]
            blocks.extend(RawBlock("paragraph", text) for text in _lines_to_paragraphs(lines))
        elif kind == "quotation":
            lines = [p.get_text() for p in component.select(".se-quote .se-text-paragraph")] or [
                p.get_text() for p in component.select(".se-text-paragraph")
            ]
            text = " ".join(_lines_to_paragraphs(lines))
            if text:
                block_type = "heading" if len(text) <= QUOTE_HEADING_MAX_CHARS else "paragraph"
                blocks.append(RawBlock(block_type, text))
        elif kind == "table":
            # 표는 행마다 "칸 | 칸"으로 이어 문단 하나로 둔다(일정·수치가 표에 있는 경우가 있다)
            rows = [
                " | ".join(cell.get_text(" ", strip=True) for cell in row.select("td, th"))
                for row in component.select("tr")
            ]
            text = " / ".join(row for row in rows if row.strip(" |"))
            if text:
                blocks.append(RawBlock("paragraph", text))
        elif kind in ("image", "imageStrip", "imageGroup", "imageSlide"):
            caption_tag = component.select_one(".se-caption")
            caption = caption_tag.get_text(" ", strip=True) if caption_tag else None
            for url in _image_urls(component):
                blocks.append(RawBlock("image", caption or None, url))
        else:
            # sticker, video, horizontalLine, oglink, map 등은 영상 재료가 아니다
            skipped[kind] = skipped.get(kind, 0) + 1
    return ParsedPost(title, blocks, skipped)


def _parse_old_editor(container: Tag) -> ParsedPost:
    """구 에디터(#postViewArea). 🟡 실제 구 에디터 글로 확인하지 못했다."""
    blocks: list[RawBlock] = []
    for element in container.find_all(["p", "div", "img"]):
        if element.name == "img":
            src = element.get("data-lazy-src") or element.get("src")
            if src and src.startswith("http"):
                blocks.append(RawBlock("image", None, src))
        elif not element.find(["p", "div"]):  # 가장 안쪽 글 덩어리만
            text = element.get_text(" ", strip=True).replace("​", "")
            if text:
                blocks.append(RawBlock("paragraph", text))
    return ParsedPost(None, blocks)


def parse_post_html(html: str) -> ParsedPost | None:
    """본문 컨테이너가 없으면 None."""
    soup = BeautifulSoup(html, "lxml")
    container = soup.select_one(".se-main-container")
    if container is not None:
        parsed = _parse_smart_editor(container)
        if parsed.title is None:
            # 모바일·PostView 모두 제목 컴포넌트가 본문 컨테이너 밖에 있다
            # .se-documentTitle 전체에는 카테고리·작성자·날짜가 같이 들어 있어 제목 글자만 고른다
            title_tag = soup.select_one(".se-documentTitle .se-title-text") or soup.select_one(".se-title-text")
            if title_tag:
                parsed.title = title_tag.get_text(" ", strip=True) or None
                if parsed.title:
                    parsed.blocks.insert(0, RawBlock("heading", parsed.title))
        return parsed
    old = soup.select_one("#postViewArea")
    if old is not None:
        parsed = _parse_old_editor(old)
        og_title = soup.select_one('meta[property="og:title"]')
        parsed.title = og_title.get("content") if og_title else None
        if parsed.title:
            parsed.blocks.insert(0, RawBlock("heading", parsed.title))
        return parsed
    return None


def text_to_blocks(text: str) -> list[Block]:
    """본문 직접 입력: 빈 줄 기준 paragraph 블록만."""
    if len(text.strip()) < MIN_TEXT_CHARS:
        raise AppError("TEXT_TOO_SHORT")
    paragraphs = [" ".join(chunk.split()) for chunk in re.split(r"\n\s*\n", text) if chunk.strip()]
    return [
        Block(id=f"b{index}", type="paragraph", text=paragraph, asset_id=None, linked_block_ids=[])
        for index, paragraph in enumerate(paragraphs, start=1)
    ]


# ── 네트워크 ──

def new_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT, "Referer": REFERER},
        timeout=httpx.Timeout(15.0),
        follow_redirects=True,
    )


async def fetch_post(client: httpx.AsyncClient, post: NaverPost) -> tuple[str, ParsedPost]:
    """모바일 주소를 먼저, 본문이 없으면 PostView를 시도한다. (가져온 HTML, 파싱 결과)."""
    not_found = False
    for url in (post.mobile_url, post.post_view_url):
        try:
            response = await client.get(url)
        except httpx.HTTPError as error:
            logger.warning("네이버 글 요청 실패 %s: %s", url, type(error).__name__)
            continue
        if response.status_code == 404:
            not_found = True
            continue
        if response.status_code != 200:
            logger.warning("네이버 글 응답 %s: %s", url, response.status_code)
            continue
        if "errorType=" in response.text[:2000]:
            not_found = True
            continue
        parsed = parse_post_html(response.text)
        if parsed is not None:
            return response.text, parsed
    raise AppError("POST_NOT_FOUND" if not_found else "EXTRACT_FAILED")


def decode_image(data: bytes) -> tuple[int, int, str]:
    with Image.open(io.BytesIO(data)) as image:
        image.verify()
    with Image.open(io.BytesIO(data)) as image:
        return image.width, image.height, (image.format or "").lower()


def save_image(data: bytes, image_format: str, dest: Path) -> Path:
    """jpg·png·webp는 그대로, 그 외(gif 등)는 첫 프레임을 png로 저장."""
    extension = {"jpeg": "jpg", "png": "png", "webp": "webp"}.get(image_format)
    if extension:
        path = dest.with_suffix(f".{extension}")
        path.write_bytes(data)
        return path
    path = dest.with_suffix(".png")
    with Image.open(io.BytesIO(data)) as image:
        image.convert("RGBA").save(path, "PNG")
    return path


async def _download(client: httpx.AsyncClient, url: str) -> bytes | str:
    """성공하면 바이트, 실패하면 이유 문자열."""
    try:
        async with client.stream("GET", url) as response:
            if response.status_code != 200:
                return f"HTTP {response.status_code}"
            chunks: list[bytes] = []
            size = 0
            async for chunk in response.aiter_bytes():
                size += len(chunk)
                if size > MAX_IMAGE_BYTES:
                    return "10MB 초과"
                chunks.append(chunk)
            return b"".join(chunks)
    except httpx.HTTPError as error:
        return type(error).__name__


async def download_images(
    client: httpx.AsyncClient,
    urls: list[str],
    dest_dir: Path,
    new_asset_id: Callable[[], str],
) -> tuple[dict[str, tuple[Asset, Path]], list[str]]:
    """원본 URL → (Asset, 파일). 규칙: 최대 20장, 장당 10MB, 가로·세로 200px 미만 제외."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    saved: dict[str, tuple[Asset, Path]] = {}
    skipped: list[str] = []
    for url in urls:
        if len(saved) >= MAX_IMAGES:
            skipped.append(f"{url} — 최대 {MAX_IMAGES}장 초과")
            continue
        if not (urlsplit(url).hostname or "").endswith(IMAGE_HOST_SUFFIX):
            skipped.append(f"{url} — 네이버 이미지 서버가 아님")
            continue
        result = await _download(client, large_image_url(url))
        if isinstance(result, str):
            skipped.append(f"{url} — {result}")
            continue
        try:
            width, height, image_format = await asyncio.to_thread(decode_image, result)
        except Exception:
            skipped.append(f"{url} — 이미지로 열 수 없음")
            continue
        if width < MIN_IMAGE_SIDE or height < MIN_IMAGE_SIDE:
            skipped.append(f"{url} — {width}x{height}, {MIN_IMAGE_SIDE}px 미만")
            continue
        asset_id = new_asset_id()
        path = await asyncio.to_thread(save_image, result, image_format, dest_dir / asset_id)
        asset = Asset(id=asset_id, origin="blog", url=f"/api/assets/{asset_id}", width=width, height=height)
        saved[url] = (asset, path)
    return saved, skipped


async def extract(
    client: httpx.AsyncClient,
    raw_url: str,
    assets_dir: Path,
    new_asset_id: Callable[[], str],
) -> ExtractResult:
    post = parse_naver_url(raw_url)
    _, parsed = await fetch_post(client, post)
    if not any(block.type == "paragraph" for block in parsed.blocks):
        raise AppError("EXTRACT_FAILED")

    image_urls = list(dict.fromkeys(block.image_url for block in parsed.blocks if block.image_url))
    saved, skipped = await download_images(client, image_urls, assets_dir, new_asset_id)

    blocks: list[Block] = []
    for raw in parsed.blocks:
        asset_id = None
        if raw.type == "image":
            if raw.image_url not in saved:
                continue  # 받지 못한 이미지는 블록에서도 뺀다
            asset_id = saved[raw.image_url][0].id
        blocks.append(Block(id=f"b{len(blocks) + 1}", type=raw.type, text=raw.text,
                            asset_id=asset_id, linked_block_ids=[]))

    logger.info("추출 %s/%s: 블록 %d, 이미지 %d(건너뜀 %d), 제외 컴포넌트 %s",
                post.blog_id, post.log_no, len(blocks), len(saved), len(skipped), parsed.skipped)
    return ExtractResult(parsed.title, blocks, list(saved.values()), skipped, parsed.skipped)
