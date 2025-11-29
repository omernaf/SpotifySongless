import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spotipy
from spotipy.exceptions import SpotifyException
import imageio_ffmpeg

from backend.src.spotify_utils import sp, extract_playlist_id, is_hebrew, reverse_hebrew_words
from backend.src.download_utils import download_song

# --- Logger setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("spotify_songless")

# Determine if running on Vercel (or use explicit env var)
# Vercel sets VERCEL=1
is_vercel = os.environ.get("VERCEL") == "1"

# --- FFmpeg Setup for Vercel ---
# spotdl requires ffmpeg. On Vercel, we use imageio-ffmpeg to provide the binary.
try:
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    ffmpeg_dir = os.path.dirname(ffmpeg_path)
    os.environ["PATH"] += os.pathsep + ffmpeg_dir
    logger.info(f"Added ffmpeg to PATH: {ffmpeg_dir}")
except Exception as e:
    logger.error(f"Failed to setup ffmpeg: {e}")

app = FastAPI()

# Middleware to strip /api prefix for Vercel
@app.middleware("http")
async def strip_api_prefix(request: Request, call_next):
    if request.url.path.startswith("/api"):
        # Modify the scope directly to strip /api
        request.scope["path"] = request.url.path[4:]
    response = await call_next(request)
    return response

# Allow CORS for local React dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MUSIC_DIR = "/tmp" if is_vercel else (os.environ.get("MUSIC_DIR") or os.path.abspath(os.path.join(os.path.dirname(__file__), "../music_files")))

# Ensure MUSIC_DIR exists
if not os.path.exists(MUSIC_DIR):
    os.makedirs(MUSIC_DIR, exist_ok=True)

# Configure spotdl cache to use /tmp on Vercel
if is_vercel:
    os.environ["SPOTDL_CACHE_PATH"] = os.path.join(MUSIC_DIR, ".spotdl_cache")
    os.environ["XDG_CACHE_HOME"] = os.path.join(MUSIC_DIR, ".cache")
    os.environ["XDG_CONFIG_HOME"] = os.path.join(MUSIC_DIR, ".config")

class PlaylistRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    query: str

@app.post("/extract_songs")
def extract_songs(req: PlaylistRequest):
    logger.info(f"Received playlist extraction request for URL: {req.url}")
    playlist_id = extract_playlist_id(req.url)
    logger.info(f"Extracted playlist ID: {playlist_id}")
    try:
        playlist = sp.playlist(playlist_id)
        name = playlist.get("name", "Unknown Playlist")
        owner = playlist.get("owner", {}).get("display_name", "")
        logger.info(f"Fetched playlist: {name} by {owner}")

        # Fetch all tracks (pagination)
        tracks = []
        results = sp.playlist_tracks(playlist_id, limit=100, offset=0)
        tracks.extend(results["items"])
        logger.info(f"Fetched {len(results['items'])} tracks (first page)")
        while results["next"]:
            results = sp.next(results)
            tracks.extend(results["items"])
            logger.info(f"Fetched {len(results['items'])} more tracks (pagination)")

        songs = []
        for item in tracks:
            track = item["track"]
            display_text = track["name"] + " - " + track["artists"][0]["name"]
            if is_hebrew(track["name"]) or is_hebrew(track["artists"][0]["name"]):
                display_text = reverse_hebrew_words(display_text)
            query = track["name"] + " " + track["artists"][0]["name"]
            songs.append({
                "display": display_text,
                "query": query
            })
        logger.info(f"Returning {len(songs)} songs from playlist")
        return {
            "name": name,
            "owner": owner,
            "songs": songs,
            "url": req.url
        }
    except SpotifyException as e:
        logger.error(f"SpotifyException: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during playlist extraction")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/download_mp3")
def download_mp3(req: DownloadRequest):
    logger.info(f"Received MP3 download request for query: {req.query}")
    try:
        mp3_path = download_song(req.query, output_dir=MUSIC_DIR)
        logger.info(f"download_song returned path: {mp3_path}")
        if not mp3_path or not os.path.exists(mp3_path):
            logger.error(f"Download failed. mp3_path: {mp3_path}")
            raise HTTPException(status_code=500, detail="Download failed")
        filename = os.path.basename(mp3_path)
        logger.info(f"MP3 file ready: {filename}")
        return {"mp3_url": f"/music/{filename}"}
    except Exception as e:
        logger.exception("Exception in download_mp3")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.get("/music/{filename}")
def get_mp3(filename: str):
    file_path = os.path.join(MUSIC_DIR, filename)
    logger.info(f"Serving MP3 file: {file_path}")
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)

@app.post("/delete_mp3")
async def delete_mp3(request: Request):
    data = await request.json()
    filename = data.get("filename")
    logger.info(f"Received delete request for filename: {filename}")
    if not filename:
        logger.warning("No filename provided in delete request")
        return {"status": "error", "detail": "No filename provided"}
    file_path = os.path.join(MUSIC_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info(f"Deleted file: {file_path}")
        return {"status": "deleted"}
    logger.warning(f"File not found for deletion: {file_path}")
    return {"status": "not_found"}

if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)