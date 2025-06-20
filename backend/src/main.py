import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

class PlaylistRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    query: str

@app.post("/extract_songs")
def extract_songs(req: PlaylistRequest):
    playlist_id = extract_playlist_id(req.url)
    if not playlist_id:
        raise HTTPException(status_code=400, detail="Invalid Spotify playlist URL")
    results = sp.playlist_items(playlist_id)
    songs = []
    for item in results['items']:
        track = item['track']
        name = track['name']
        artists = ', '.join([artist['name'] for artist in track['artists']])
        display_text = f"{name} - {artists}"
        if is_hebrew(name) or is_hebrew(artists):
            display_text = reverse_hebrew_words(display_text)
        query = f"{name} {artists}".replace('&', '')
        songs.append({"display": display_text, "query": query})
    return {"songs": songs}

@app.post("/download_mp3")
def download_mp3(req: DownloadRequest):
    mp3_path = open_top_youtube_result(req.query)
    if not mp3_path or not os.path.exists(mp3_path):
        raise HTTPException(status_code=500, detail="Download failed")
    filename = os.path.basename(mp3_path)
    return {"mp3_url": f"/music/{filename}"}

@app.get("/music/{filename}")
def get_mp3(filename: str):
    file_path = os.path.join("music_files", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)