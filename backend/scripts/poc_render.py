"""작업3 PoC: 이미지 3장 + 음성(사인파) + 한글 자막 → 1080×1920 MP4. 모션 5종을 한 번씩 쓴다.

    .venv/Scripts/python scripts/poc_render.py

산출물은 data/poc_render/(커밋 안 함), 기록은 samples/render_poc/RESULT.md에 직접 옮겨 적는다.
TTS는 쓰지 않는다(비용 0). 렌더 명령은 CLAUDE.md 5장 ⑦을 그대로 따른다.
"""

import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw

BACKEND_DIR = Path(__file__).resolve().parent.parent
IMAGES_DIR = BACKEND_DIR / "tests" / "fixtures" / "images"
FONT_FILE = BACKEND_DIR / "fonts" / "NotoSansKR-Bold.ttf"
WORK_DIR = BACKEND_DIR / "data" / "poc_render"
FPS = 30

# (이미지, 음성 길이 초, 모션, 자막 덩어리)
SCENES = [
    ("landscape.jpg", 3.0, "zoom_in", ["문 열기 20분 전부터", "줄 서는 빵집이 있어요"]),
    ("portrait.jpg", 3.5, "zoom_out", ["대표 메뉴는 소금빵,", "하루 300개만 구워요"]),
    ("square.jpg", 3.0, "pan_left", ["겉은 바삭하고", "속은 버터 향이 진해요"]),
    ("landscape.jpg", 3.2, "pan_right", ["무화과 깜빠뉴는", "커피와 잘 어울렸어요"]),
    ("portrait.jpg", 2.8, "none", ["근처에 가면", "꼭 한 번 들러 보세요!"]),
]

MOTIONS = {
    "zoom_in": ("1+0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "zoom_out": ("1.12-0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "pan_left": ("1.12", "(iw-iw/zoom)*on/{F}", "ih/2-(ih/zoom/2)"),
    "pan_right": ("1.12", "(iw-iw/zoom)*(1-on/{F})", "ih/2-(ih/zoom/2)"),
    "none": ("1", "0", "0"),
}

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


def run(command: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, capture_output=True, encoding="utf-8", errors="replace")
    if result.returncode != 0:
        print("\n".join(result.stderr.splitlines()[-20:]), file=sys.stderr)
        raise SystemExit(f"실패: {command[0]} (exit {result.returncode})")
    return result


def make_images() -> None:
    """가로·세로·정사각 테스트 이미지. 격자를 그려 모션이 눈에 보이게 한다."""
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    for name, size, color in [
        ("landscape.jpg", (1200, 800), (231, 111, 81)),
        ("portrait.jpg", (800, 1200), (42, 157, 143)),
        ("square.jpg", (1000, 1000), (233, 196, 106)),
    ]:
        path = IMAGES_DIR / name
        if path.exists():
            continue
        image = Image.new("RGB", size, color)
        draw = ImageDraw.Draw(image)
        for x in range(0, size[0], 100):
            draw.line([(x, 0), (x, size[1])], fill=(255, 255, 255), width=2)
        for y in range(0, size[1], 100):
            draw.line([(0, y), (size[0], y)], fill=(255, 255, 255), width=2)
        draw.ellipse([size[0] // 2 - 80, size[1] // 2 - 80, size[0] // 2 + 80, size[1] // 2 + 80], fill=(38, 70, 83))
        draw.rectangle([0, 0, size[0] - 1, size[1] - 1], outline=(0, 0, 0), width=12)
        image.save(path, "JPEG", quality=80)


def probe_duration(path: Path) -> float:
    result = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(result.stdout.strip())


def ass_time(seconds: float) -> str:
    centiseconds = round(seconds * 100)
    hours, rest = divmod(centiseconds, 360000)
    minutes, rest = divmod(rest, 6000)
    secs, cs = divmod(rest, 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"


def write_ass(path: Path, chunks: list[str], audio_sec: float) -> None:
    total = sum(len(chunk) for chunk in chunks)
    start = 0.0
    lines = []
    for chunk in chunks:
        end = start + audio_sec * len(chunk) / total
        lines.append(f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{chunk}")
        start = end
    path.write_text(ASS_HEADER + "\n".join(lines) + "\n", encoding="utf-8")


def render_scene(index: int, image: str, motion: str, duration: float) -> Path:
    frames = round(duration * FPS)
    z, x, y = (expr.format(F=frames) for expr in MOTIONS[motion])
    shutil.copy(IMAGES_DIR / image, WORK_DIR / f"s{index}.jpg")
    filter_complex = (
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];"
        "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
        f"[bg][fg]overlay=(W-w)/2:(H-h)/2,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=1080x1920:fps={FPS},"
        f"ass=s{index}.ass:fontsdir=fonts,"
        # JPEG 입력은 풀 레인지(yuvj420p)로 남는다. 일반 플레이어 호환을 위해 limited 범위로 바꾼다
        "scale=out_range=tv,format=yuv420p[v];"
        "[1:a]apad[a]"
    )
    output = WORK_DIR / f"s{index}.mp4"
    # 작업 폴더를 cwd로 두고 상대 경로만 쓴다(Windows 경로의 ':'·'\'가 필터 인자를 깨뜨림)
    run([
        "ffmpeg", "-y", "-i", f"s{index}.jpg", "-i", f"s{index}.mp3",
        "-filter_complex", filter_complex, "-map", "[v]", "-map", "[a]", "-t", f"{duration:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", output.name,
    ], cwd=WORK_DIR)
    return output


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    for tool in ("ffmpeg", "ffprobe"):
        if shutil.which(tool) is None:
            raise SystemExit(f"{tool}가 PATH에 없습니다. README '설치' 참고")
    if not FONT_FILE.is_file():
        raise SystemExit(f"폰트가 없습니다: {FONT_FILE}")

    make_images()
    if WORK_DIR.exists():
        shutil.rmtree(WORK_DIR)
    (WORK_DIR / "fonts").mkdir(parents=True)
    shutil.copy(FONT_FILE, WORK_DIR / "fonts" / FONT_FILE.name)
    version = run(["ffmpeg", "-version"]).stdout.splitlines()[0]
    print(version)

    clips: list[Path] = []
    rows = []
    started_all = time.perf_counter()
    for index, (image, audio_len, motion, chunks) in enumerate(SCENES, start=1):
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", f"sine=frequency={330 + 110 * index}:duration={audio_len}",
             "-c:a", "libmp3lame", "-q:a", "4", f"s{index}.mp3"], cwd=WORK_DIR)
        audio_sec = probe_duration(WORK_DIR / f"s{index}.mp3")
        duration = audio_sec + 0.3
        write_ass(WORK_DIR / f"s{index}.ass", chunks, audio_sec)

        started = time.perf_counter()
        clip = render_scene(index, image, motion, duration)
        elapsed = time.perf_counter() - started
        clips.append(clip)

        stream = json.loads(run([
            "ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
            "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", str(clip),
        ]).stdout)["streams"][0]
        rows.append((index, image, motion, duration, stream, probe_duration(clip), elapsed))
        print(f"s{index} {image:14} {motion:9} 목표 {duration:.2f}s → 실제 {rows[-1][5]:.2f}s, "
              f"{stream['width']}x{stream['height']} {stream['r_frame_rate']} 프레임 {stream['nb_read_frames']}, "
              f"렌더 {elapsed:.2f}s")

    (WORK_DIR / "list.txt").write_text("".join(f"file '{clip.name}'\n" for clip in clips), encoding="utf-8")
    started = time.perf_counter()
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy",
         "-movflags", "+faststart", "output.mp4"], cwd=WORK_DIR)
    concat_sec = time.perf_counter() - started
    total_sec = time.perf_counter() - started_all

    final = json.loads(run([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt:format=duration,size",
        "-of", "json", str(WORK_DIR / "output.mp4"),
    ]).stdout)
    print(f"연결 {concat_sec:.2f}s, 전체 {total_sec:.2f}s")
    print(json.dumps(final, ensure_ascii=False, indent=2))

    # 자막 확인용 프레임(각 장면 가운데)
    offset = 0.0
    for index, row in enumerate(rows, start=1):
        run(["ffmpeg", "-y", "-ss", f"{offset + row[5] / 2:.2f}", "-i", "output.mp4", "-frames:v", "1",
             "-vf", "scale=540:960", f"frame_s{index}.png"], cwd=WORK_DIR)
        offset += row[5]
    print(f"프레임: {WORK_DIR}/frame_s1..{len(rows)}.png")


if __name__ == "__main__":
    main()
