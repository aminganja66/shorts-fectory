"""Free, offline Hindi voice with Kokoro (Apache-2.0) — fallback when there is no ElevenLabs.
Usage:  npm run voice:local -- <episodeId> [voice]      voices: hm_omega, hm_psi (male) · hf_alpha, hf_beta (female)
Install once:  pip install "kokoro>=0.9" soundfile   +  espeak-ng (winget install espeak-ng / brew install espeak-ng / apt install espeak-ng)
Then:          npm run timing -- <episodeId>            (word timings for captions)
Quality is below ElevenLabs — use it for drafts or when credits run out.
"""
import json, sys, subprocess, pathlib
import numpy as np

root = pathlib.Path(__file__).resolve().parent.parent
ep = sys.argv[1] if len(sys.argv) > 1 else sys.exit("usage: tts_local.py <episodeId> [voice]")
voice = sys.argv[2] if len(sys.argv) > 2 else None
d = root / "public" / "episodes" / ep
sb = json.loads((d / "storyboard.json").read_text(encoding="utf-8"))
voice = voice or ("hm_omega" if sb["channel"] == "brand" else "hf_alpha")

import soundfile as sf
from kokoro import KPipeline

pipe = KPipeline(lang_code="h")  # h = Hindi
chunks = []
for line in sb["lines"]:
    text = line.get("voice") or line["text"]
    for _, _, audio in pipe(text, voice=voice, speed=1.0):
        chunks.append(np.asarray(audio))
    chunks.append(np.zeros(int(24000 * 0.25)))  # short breath between lines
wav = d / "voice-local.wav"
sf.write(wav, np.concatenate(chunks), 24000)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-b:a", "192k", str(d / "voice.mp3")], check=True)
wav.unlink()
print(f"✔ voice.mp3 ({voice}) → now run: npm run timing -- {ep}")
