"""⑦ FFmpeg 합성. 장면별 클립을 만든 뒤 이어 붙인다. 출력 1080×1920, 30fps, H.264 + AAC.

움직임은 요청마다 고른다. fast는 zoompan(정수 좌표라 떨림, 빠름), smooth는 perspective다.
smooth는 배경+원본을 한 장으로 먼저 합성하고 그 한 장을 프레임마다 소수점 좌표로 보간한다
(실측: 사진 팬 프레임 간 변화 편차 0.939px → 0.015px).
"""

import os
import shutil
from pathlib import Path

from app.models import Motion, MotionQuality
from app.pipeline.media import run_tool

FPS = 30
ZOOM = 1.12

COMPOSE_FILTER = (
    "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:2[bg];"
    "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg];"
    "[bg][fg]overlay=(W-w)/2:(H-h)/2[out]"
)


ZOOMPAN: dict[Motion, tuple[str, str, str]] = {
    "zoom_in": ("1+0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "zoom_out": ("1.12-0.12*on/{F}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    "pan_left": ("1.12", "(iw-iw/zoom)*on/{F}", "ih/2-(ih/zoom/2)"),
    "pan_right": ("1.12", "(iw-iw/zoom)*(1-on/{F})", "ih/2-(ih/zoom/2)"),
    "none": ("1", "0", "0"),
}

_ENCODE = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
           "-bsf:v", "h264_metadata=video_full_range_flag=0", "-c:a", "aac", "-b:a", "128k"]


def motion_filter(motion: Motion, frames: int) -> str:
    """보여 줄 원본 영역의 네 모서리를 프레임 번호(in)의 식으로 지정한다. none은 움직이지 않으니 필터가 없다."""
    if motion == "none":
        return ""
    progress = f"(in/{frames})"
    if motion in ("zoom_in", "zoom_out"):
        scale = f"(1+{ZOOM - 1:.2f}*{progress})" if motion == "zoom_in" else f"({ZOOM}-{ZOOM - 1:.2f}*{progress})"
        left, right = f"(W/2-W/2/{scale})", f"(W/2+W/2/{scale})"
        top, bottom = f"(H/2-H/2/{scale})", f"(H/2+H/2/{scale})"
    else:
        travel = progress if motion == "pan_left" else f"(1-{progress})"
        left = f"((W-W/{ZOOM})*{travel})"
        right = f"({left}+W/{ZOOM})"
        top, bottom = f"(H/2-H/2/{ZOOM})", f"(H/2+H/2/{ZOOM})"
    return (
        f"perspective=x0='{left}':y0='{top}':x1='{right}':y1='{top}':x2='{left}':y2='{bottom}':x3='{right}':y3='{bottom}'"
        ":interpolation=cubic:sense=source:eval=frame,"
    )


def prepare_fonts(clips_dir: Path, font_file: Path) -> None:
    """ass 필터는 상대 경로만 쓰므로 작업 폴더로 폰트를 복사한다."""
    fonts = clips_dir / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    target = fonts / font_file.name
    if not target.is_file():
        shutil.copy(font_file, target)


def _relative(path: Path, cwd: Path) -> str:
    return Path(os.path.relpath(path, cwd)).as_posix()


def render_clip(clips_dir: Path, name: str, image: Path, audio: Path, ass: Path, motion: Motion, duration: float,
                quality: MotionQuality = "fast") -> Path:
    render = _render_smooth if quality == "smooth" else _render_fast
    return render(clips_dir, name, image, audio, ass, motion, duration)


def _render_fast(clips_dir: Path, name: str, image: Path, audio: Path, ass: Path, motion: Motion, duration: float) -> Path:
    """속도 중시: zoompan 한 번에. 좌표가 정수로 반올림돼 약간 떨린다."""
    frames = round(duration * FPS)
    z, x, y = (expression.format(F=frames) for expression in ZOOMPAN[motion])
    filter_complex = (
        f"{COMPOSE_FILTER.removesuffix('[out]')},"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={frames}:s=1080x1920:fps={FPS},"
        f"ass={_relative(ass, clips_dir)}:fontsdir=fonts,"
        "scale=out_range=tv,format=yuv420p[v];"
        "[1:a]apad[a]"
    )
    output = clips_dir / f"{name}.mp4"
    run_tool([
        "ffmpeg", "-y", "-i", _relative(image, clips_dir), "-i", _relative(audio, clips_dir),
        "-filter_complex", filter_complex, "-map", "[v]", "-map", "[a]", "-t", f"{duration:.3f}",
        *_ENCODE, output.name,
    ], cwd=clips_dir)
    return output


def _render_smooth(clips_dir: Path, name: str, image: Path, audio: Path, ass: Path, motion: Motion, duration: float) -> Path:
    """품질 중시: 한 장으로 합성한 뒤 소수점 좌표로 보간한다."""
    frames = round(duration * FPS)
    still = clips_dir / f"{name}_still.png"
    # 작업 폴더를 cwd로 두고 상대 경로만 쓴다(Windows 경로의 ':'·'\'가 필터 인자를 깨뜨림)
    run_tool([
        "ffmpeg", "-y", "-i", _relative(image, clips_dir), "-filter_complex", COMPOSE_FILTER,
        "-map", "[out]", "-frames:v", "1", still.name,
    ], cwd=clips_dir)
    filter_complex = (
        f"[0:v]{motion_filter(motion, frames)}"
        f"ass={_relative(ass, clips_dir)}:fontsdir=fonts,"
        # 입력의 풀 레인지가 남으면 결과가 yuvj420p가 된다(B3).
        "scale=out_range=tv,format=yuv420p[v];"
        "[1:a]apad[a]"
    )
    output = clips_dir / f"{name}.mp4"
    run_tool([
        "ffmpeg", "-y", "-loop", "1", "-framerate", str(FPS), "-i", still.name, "-i", _relative(audio, clips_dir),
        "-filter_complex", filter_complex, "-map", "[v]", "-map", "[a]", "-frames:v", str(frames),
        "-t", f"{duration:.3f}", *_ENCODE, output.name,
    ], cwd=clips_dir)
    still.unlink(missing_ok=True)
    return output


def concat_clips(clips_dir: Path, clips: list[Path], output: Path) -> None:
    (clips_dir / "list.txt").write_text("".join(f"file '{clip.name}'\n" for clip in clips), encoding="utf-8")
    temporary = clips_dir / "output.tmp.mp4"
    run_tool(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy",
              "-movflags", "+faststart", temporary.name], cwd=clips_dir)
    temporary.replace(output)
