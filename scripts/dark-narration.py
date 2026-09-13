"""Generate Yunxi narration and phrase captions from Edge word boundaries.
Run: uv run --with edge-tts==7.2.8 python scripts/dark-narration.py
"""
import asyncio
import json
from pathlib import Path
import re
import subprocess
import sys
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
EDITION = sys.argv[1] if len(sys.argv) > 1 else 'dark'
assert EDITION in ('dark', 'editorial', 'flow', 'lesson', 'ha', 'ha-lesson')
PROBE = ROOT / "node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe"


async def main():
    lines = json.loads((ROOT / f"src/{EDITION}-narration.json").read_text(encoding="utf-8"))
    target = ROOT / f"public/audio/quorum-{EDITION}"
    target.mkdir(parents=True, exist_ok=True)
    clips = []
    overruns = []
    for i, line in enumerate(lines):
        assert all(len(chunk) <= 16 for chunk in line["chunks"])
        path = target / f"{i + 1:02}.mp3"
        boundaries = []
        speech = edge_tts.Communicate("".join(line["chunks"]), "zh-CN-YunxiNeural", rate="+8%", boundary="WordBoundary")
        with path.open("wb") as audio:
            async for item in speech.stream():
                if item["type"] == "audio":
                    audio.write(item["data"])
                elif item["type"] == "WordBoundary":
                    boundaries.append(item)
        duration = float(subprocess.check_output([
            str(PROBE), "-v", "error", "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path)], text=True).strip())
        if duration > line["end"] - line["start"] - .1:
            overruns.append(f"Clip {i + 1}: {duration:.2f}s exceeds slot; shorten narration.")
        normalize = lambda text: re.sub(r"\W", "", text, flags=re.UNICODE).lower()
        word_starts = []
        cursor = 0
        for word in boundaries:
            word_starts.append((cursor, word["offset"] / 10_000_000))
            cursor += len(normalize(word["text"]))
        assert cursor == len(normalize("".join(line["chunks"]))), "Word boundaries do not match narration."
        captions = []
        cursor = 0
        for chunk in line["chunks"]:
            offset = next(time for pos, time in word_starts if pos == cursor)
            captions.append({"start": round(line["start"] + offset, 3), "text": chunk})
            cursor += len(normalize(chunk))
        clips.append({"start": line["start"], "end": line["end"], "duration": duration,
                      "file": f"audio/quorum-{EDITION}/{path.name}", "captions": captions})
        print(f"Clip {i + 1}: {duration:.3f}s; beats {[c['start'] for c in captions]}", flush=True)
    assert not overruns, "\n".join(overruns)
    (ROOT / f"src/{EDITION}-audio.json").write_text(json.dumps(clips, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


asyncio.run(main())
