"""Usage: python scripts/fetch_transcripts.py <youtube-url-1> <youtube-url-2>
Saves transcripts/episode-N-<videoid>.txt with [HH:MM:SS] stamps every ~30s.
Install: pip install youtube-transcript-api
"""
import os
import re
import sys
from youtube_transcript_api import YouTubeTranscriptApi


def video_id(url):
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", url)
    return m.group(1) if m else url.strip()


def stamp(s):
    s = int(s)
    return f"{s // 3600:02d}:{s // 60 % 60:02d}:{s % 60:02d}"


if len(sys.argv) < 2:
    print("Usage: python scripts/fetch_transcripts.py <youtube-url-1> <youtube-url-2>")
    sys.exit(1)

os.makedirs("transcripts", exist_ok=True)
api = YouTubeTranscriptApi()

for i, url in enumerate(sys.argv[1:], 1):
    vid = video_id(url)
    blocks, cur, start = [], [], 0
    for sn in api.fetch(vid):
        if not cur:
            start = sn.start
        cur.append(sn.text.replace("\n", " "))
        if sn.start - start >= 30:
            blocks.append(f"[{stamp(start)}] {' '.join(cur)}")
            cur = []
    if cur:
        blocks.append(f"[{stamp(start)}] {' '.join(cur)}")
    path = f"transcripts/episode-{i}-{vid}.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))
    print(f"Saved {path}")
