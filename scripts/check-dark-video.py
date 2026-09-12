"""Check final encoded video, not just source animation. Run with uv --with numpy."""
import json
from pathlib import Path
import subprocess
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
BIN = ROOT / "node_modules/@remotion/compositor-win32-x64-msvc"
VIDEO = ROOT / "out/quorum-dark-30s.mp4"
meta = json.loads(subprocess.check_output([str(BIN / "ffprobe.exe"), "-v", "error",
    "-show_streams", "-show_format", "-of", "json", str(VIDEO)], text=True))
video = next(s for s in meta["streams"] if s["codec_type"] == "video")
audio = next(s for s in meta["streams"] if s["codec_type"] == "audio")
assert (video["width"], video["height"], video["r_frame_rate"], video["nb_frames"]) == (1920, 1080, "30/1", "900")
assert float(video["duration"]) == 30
assert float(audio["duration"]) >= 28.7
print(f"Video: {video['codec_name']} 1920x1080, 900 frames, 30s. Audio: {audio['codec_name']}.")
raw = subprocess.check_output([str(BIN / "ffmpeg.exe"), "-v", "error", "-i", str(VIDEO),
    "-an", "-vf", "scale=320:180", "-pix_fmt", "gray", "-c:v", "rawvideo", "-f", "image2pipe", "-"])
decoded = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 180, 320)
assert len(decoded) == 900
frames = decoded[::3, 28:158].astype(np.int16)
assert len(frames) == 300
subprocess.run([str(BIN / "ffmpeg.exe"), "-v", "error", "-i", str(VIDEO),
    "-vn", "-c:a", "pcm_s16le", "-f", "null", "-"], check=True)
diffs = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
print("Content motion (10 Hz; gray mean change <0.35 = still; excludes HUD/captions):")
failed = 0
for start, end in [(0, 7), (7, 14), (14, 22), (22, 30)]:
    still = diffs[start * 10:end * 10 - 1] < .35
    longest = run = 0
    for value in still:
        run = run + 1 if value else 0
        longest = max(longest, run)
    percent = float(still.mean()) * 100
    ok = percent <= 40 and longest <= 10
    failed += not ok
    print(f"{start:02}-{end:02}s: still {percent:.1f}%, longest {longest / 10:.1f}s; {'PASS' if ok else 'REVIEW'}")
assert not failed, "Review flagged shots; motion metrics are not a teaching-effectiveness score."
