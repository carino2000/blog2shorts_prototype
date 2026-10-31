"""⑦ FFmpeg 합성. 장면별 클립을 만든 뒤 이어 붙인다. 출력 1080×1920, 30fps, H.264 + AAC."""

import os
import shutil
from pathlib import Path

from app.models import Motion
from app.pipeline.media import run_tool

FPS = 30

MOTIONS: dict[Motion, tuple[str, str, str]] = {
    "zoom_in": ("1+0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "zoom_out": ("1.12-0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "pan_left": ("1.12", "(iw-iw/zoom)*on/{F}", "ih/2-(ih/zoom/2)"),
    "pan_right": ("1.12", "(iw-iw/zoom)*(1-on/{F})", "ih/2-(ih/zoom/2)"),
    "none": ("1", "0", "0"),
}


def prepare_fonts(clips_dir: Path, font_file: Path) -> None:
    """ass 필터는 상대 경로만 쓰므로 작업 폴더로 폰트를 복사한다."""
    fonts = clips_dir / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    target = fonts / font_file.name
    if not target.is_file():
        shutil.copy(font_file, target)


def _relative(path: Path, cwd: Path) -> str:
    return Path(os.path.relpath(path, cwd)).as_posix()


def render_clip(clips_dir: Path, name: str, image: Path, audio: Path, ass: Path, motion: Motion, duration: float) -> Path:
    frames = round(duration * FPS)
    z, x, y = (expression.format(F=frames) for expression in MOTIONS[motion])
    # 작업 폴더를 cwd로 두고 상대 경로만 쓴다(Windows 경로의 ':'·'\'가 필터 인자를 깨뜨림)
    filter_complex = (
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];"
        "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
        "[bg][fg]overlay=(W-w)/2:(H-h)/2,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=1080x1920:fps={FPS},"
        f"ass={_relative(ass, clips_dir)}:fontsdir=fonts,"
        # JPEG 입력의 풀 레인지가 남으면 결과가 yuvj420p가 된다(B3)
        "scale=out_range=tv,format=yuv420p[v];"
        "[1:a]apad[a]"
    )
    output = clips_dir / f"{name}.mp4"
    run_tool([
        "ffmpeg", "-y", "-i", _relative(image, clips_dir), "-i", _relative(audio, clips_dir),
        "-filter_complex", filter_complex, "-map", "[v]", "-map", "[a]", "-t", f"{duration:.3f}",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", output.name,
    ], cwd=clips_dir)
    return output


def concat_clips(clips_dir: Path, clips: list[Path], output: Path) -> None:
    (clips_dir / "list.txt").write_text("".join(f"file '{clip.name}'\n" for clip in clips), encoding="utf-8")
    temporary = clips_dir / "output.tmp.mp4"
    run_tool(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy",
              "-movflags", "+faststart", temporary.name], cwd=clips_dir)
    temporary.replace(output)
