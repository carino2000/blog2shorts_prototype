import pytest

from app.errors import AppError
from app.pipeline import subtitle, tts
from app.providers.tts_base import TtsCallError


class FakeTts:
    name = "fake"
    model = "m"
    voice = "v"

    def __init__(self) -> None:
        self.calls = 0
        self.fail = False

    async def synthesize(self, text: str) -> bytes:
        self.calls += 1
        if self.fail:
            raise TtsCallError("가짜 실패")
        return b"mp3"


def test_split_on_punctuation_keeps_numbers() -> None:
    assert subtitle.split_chunks("수강료는 160,000원, 평점은 2.5점! 괜찮나요?") == ["수강료는 160,000원,", "평점은 2.5점!", "괜찮나요?"]


def test_split_long_chunk_on_words() -> None:
    chunks = subtitle.split_chunks("자동차 구조와 주요 장치의 작동 원리를 이해하는 것이 무엇보다 중요합니다.")
    assert len(chunks) > 1
    assert all(len(chunk) <= subtitle.MAX_CHUNK_CHARS for chunk in chunks)
    assert " ".join(chunks) == "자동차 구조와 주요 장치의 작동 원리를 이해하는 것이 무엇보다 중요합니다."


def test_word_longer_than_limit_is_cut_without_losing_text() -> None:
    limit = subtitle.MAX_CHUNK_CHARS
    word = "가" * (limit * 2 + 2)
    assert subtitle.split_chunks(word) == ["가" * limit, "가" * limit, "가가"]
    chunks = subtitle.split_chunks(f"앞말 {word} 뒷말")
    assert chunks == ["앞말", "가" * limit, "가" * limit, "가가 뒷말"]


@pytest.mark.parametrize("length", [subtitle.MAX_CHUNK_CHARS, subtitle.MAX_CHUNK_CHARS + 1])
def test_word_at_limit_boundary(length: int) -> None:
    chunks = subtitle.split_chunks("가" * length)
    assert len(chunks) == (1 if length <= subtitle.MAX_CHUNK_CHARS else 2)
    assert "".join(chunks) == "가" * length


def test_chunk_with_spaces_exactly_at_limit_stays_whole() -> None:
    text = "가나다라마바 아자차카타파하"
    assert len(text) == subtitle.MAX_CHUNK_CHARS
    assert subtitle.split_chunks(text) == [text]
    assert subtitle.split_chunks(text + "거") == ["가나다라마바", "아자차카타파하거"]


def test_cut_word_times_still_sum_to_audio_length() -> None:
    items = subtitle.build_subtitles("https://blog.naver.com/abc/123456789", 3.0)
    assert all(len(item.text) <= subtitle.MAX_CHUNK_CHARS for item in items)
    assert items[0].start_sec == 0 and items[-1].end_sec == 3.0
    assert all(item.start_sec < item.end_sec for item in items)


def test_ass_style_values() -> None:
    style = next(line for line in subtitle.ASS_HEADER.splitlines() if line.startswith("Style:")).split(",")
    assert style[2] == "88"  # Fontsize
    assert style[16] == "5"  # Outline
    assert style[18:22] == ["2", "60", "60", "360"]  # 가운데 정렬, 좌우·하단 여백


@pytest.mark.parametrize("audio_sec", [1.0, 3.337, 7.71, 12.0])
def test_subtitle_times_sum_to_audio_length(audio_sec: float) -> None:
    items = subtitle.build_subtitles("합격률은 회차와 연도에 따라 달라져요. 최신 통계와 함께, 시험의 특징도 확인해 보세요!", audio_sec)
    assert items[0].start_sec == 0
    assert items[-1].end_sec == audio_sec
    for before, after in zip(items, items[1:]):
        assert before.end_sec == after.start_sec
        assert before.start_sec < before.end_sec
    assert sum(item.end_sec - item.start_sec for item in items) == pytest.approx(audio_sec)


def test_write_ass_escapes_tags(tmp_path) -> None:
    path = tmp_path / "s.ass"
    subtitle.write_ass(path, subtitle.build_subtitles(r"안녕{\b1}하세요", 2.0))
    text = path.read_text(encoding="utf-8")
    assert "Fontname" in text and "Noto Sans KR" in text
    dialogue = text.splitlines()[-1]
    assert dialogue.startswith("Dialogue: 0,0:00:00.00,0:00:02.00,Default")
    assert "{" not in dialogue and "\\" not in dialogue


@pytest.mark.asyncio
async def test_same_text_calls_tts_once(tmp_path, caplog) -> None:
    provider = FakeTts()
    with caplog.at_level("INFO", logger="blog2shorts"):
        first = await tts.synthesize_scene(provider, "같은 문구", tmp_path)
        second = await tts.synthesize_scene(provider, "같은 문구", tmp_path)
    assert first == second and first.read_bytes() == b"mp3"
    assert provider.calls == 1
    assert "캐시 사용" in caplog.text
    await tts.synthesize_scene(provider, "다른 문구", tmp_path)
    assert provider.calls == 2


def test_hash_changes_with_voice_and_model(tmp_path) -> None:
    a, b, c = FakeTts(), FakeTts(), FakeTts()
    b.voice = "other"
    c.model = "other"
    paths = {tts.audio_path(item, "문구", tmp_path) for item in (a, b, c)}
    assert len(paths) == 3


@pytest.mark.asyncio
async def test_failure_is_tts_failed_and_leaves_no_cache(tmp_path) -> None:
    provider = FakeTts()
    provider.fail = True
    with pytest.raises(AppError) as error:
        await tts.synthesize_scene(provider, "문구", tmp_path)
    assert error.value.code == "TTS_FAILED"
    assert list(tmp_path.iterdir()) == []
