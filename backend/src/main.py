import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spotipy
from spotipy.exceptions import SpotifyException

from spotify_utils import sp, extract_playlist_id, is_hebrew, reverse_hebrew_words
from youtube_utils import open_top_youtube_result

app = FastAPI()

# Allow CORS for local React dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MUSIC_DIR = os.environ.get("MUSIC_DIR") or os.path.abspath(os.path.join(os.path.dirname(__file__), "../music_files"))

class PlaylistRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    query: str

@app.post("/extract_songs")
def extract_songs(req: PlaylistRequest):
    playlist_id = extract_playlist_id(req.url)
    try:
        playlist = sp.playlist(playlist_id)
        name = playlist.get("name", "Unknown Playlist")
        owner = playlist.get("owner", {}).get("display_name", "")

        # Fetch all tracks (pagination)
        tracks = []
        results = sp.playlist_tracks(playlist_id, limit=100, offset=0)
        tracks.extend(results["items"])
        while results["next"]:
            results = sp.next(results)
            tracks.extend(results["items"])

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
        return {
            "name": name,
            "owner": owner,
            "songs": songs,
            "url": req.url
        }
    except SpotifyException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/download_mp3")
def download_mp3(req: DownloadRequest):
    try:
        mp3_path = open_top_youtube_result(req.query)
        if not mp3_path or not os.path.exists(mp3_path):
            print("Download failed. mp3_path:", mp3_path)
            raise HTTPException(status_code=500, detail="Download failed")
        filename = os.path.basename(mp3_path)
        return {"mp3_url": f"/music/{filename}"}
    except Exception as e:
        print("Exception in download_mp3:", e)
        raise HTTPException(status_code=500, detail=f"Download failed: {e}")

@app.get("/music/{filename}")
def get_mp3(filename: str):
    file_path = os.path.join(MUSIC_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)

@app.post("/delete_mp3")
async def delete_mp3(request: Request):
    data = await request.json()
    filename = data.get("filename")
    if not filename:
        return {"status": "error", "detail": "No filename provided"}
    file_path = os.path.join(MUSIC_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        return {"status": "deleted"}
    return {"status": "not_found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)