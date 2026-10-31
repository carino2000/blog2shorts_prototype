"""⑥ 자막 분할·ASS 생성."""

import re
from pathlib import Path

from app.models import Subtitle

MAX_CHUNK_CHARS = 18

# 🟡 값은 B3 프레임으로 확인했다. 쉽게 바꿀 수 있다
ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans KR,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,4,0,2,60,60,360,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def split_chunks(text: str) -> list[str]:
    """문장부호(. ? ! ,) 뒤 공백에서 나눈다(160,000·2.5는 안 나뉜다). 18자를 넘으면 어절로 다시 나눈다."""
    chunks: list[str] = []
    for part in re.split(r"(?<=[.?!,])\s+", " ".join(text.split())):
        current = ""
        for word in part.split(" "):
            candidate = f"{current} {word}".strip()
            if current and len(candidate) > MAX_CHUNK_CHARS:
                chunks.append(current)
                current = word
            else:
                current = candidate
        if current:
            chunks.append(current)
    return chunks


def build_subtitles(text: str, audio_sec: float) -> list[Subtitle]:
    """덩어리 시간 = 음성 길이 × (덩어리 글자 수 ÷ 전체 글자 수). 마지막 끝은 음성 길이와 정확히 같다."""
    chunks = split_chunks(text)
    if not chunks:
        return []
    total = sum(len(chunk.replace(" ", "")) for chunk in chunks)
    subtitles: list[Subtitle] = []
    used = 0
    start = 0.0
    for index, chunk in enumerate(chunks):
        used += len(chunk.replace(" ", ""))
        end = audio_sec if index == len(chunks) - 1 else round(audio_sec * used / total, 3)
        subtitles.append(Subtitle(start_sec=start, end_sec=end, text=chunk))
        start = end
    return subtitles


def _ass_time(seconds: float) -> str:
    centiseconds = round(seconds * 100)
    hours, rest = divmod(centiseconds, 360000)
    minutes, rest = divmod(rest, 6000)
    secs, cs = divmod(rest, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"


def _ass_escape(text: str) -> str:
    # 사용자 문구가 ASS 태그로 해석되지 않게 한다
    return text.replace("\\", "＼").replace("{", "｛").replace("}", "｝")


def write_ass(path: Path, subtitles: list[Subtitle]) -> None:
    lines = [
        f"Dialogue: 0,{_ass_time(item.start_sec)},{_ass_time(item.end_sec)},Default,,0,0,0,,{_ass_escape(item.text)}"
        for item in subtitles
    ]
    path.write_text(ASS_HEADER + "\n".join(lines) + "\n", encoding="utf-8")
