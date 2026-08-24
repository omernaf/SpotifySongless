import os
import logging
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spotipy
from spotipy.exceptions import SpotifyException
import requests

from backend.src.spotify_utils import sp, extract_playlist_id, is_hebrew, reverse_hebrew_words
from backend.src.deezer_utils import (
    get_deezer_preview,
    extract_deezer_playlist_id,
    extract_deezer_playlist
)

# --- Logger setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("spotify_songless")

app = FastAPI(title="SpotifySongless API", version="2.0.0")

# Middleware to strip /api prefix for Vercel / reverse proxies
@app.middleware("http")
async def strip_api_prefix(request: Request, call_next):
    if request.url.path.startswith("/api"):
        request.scope["path"] = request.url.path[4:]
    response = await call_next(request)
    return response

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlaylistRequest(BaseModel):
    url: str

class PreviewRequest(BaseModel):
    query: str = ""
    artist: str = ""
    title: str = ""

@app.post("/extract_songs")
def extract_songs(req: PlaylistRequest):
    logger.info(f"Received playlist extraction request for URL: {req.url}")
    
    # Check if URL is Deezer playlist or Spotify playlist
    deezer_id = extract_deezer_playlist_id(req.url)
    if deezer_id:
        logger.info(f"Identified Deezer playlist ID: {deezer_id}")
        try:
            res = extract_deezer_playlist(deezer_id)
            songs = []
            for track in res["raw_tracks"]:
                title = track.get("title")
                artist_info = track.get("artist", {})
                artist_name = artist_info.get("name", "Unknown Artist")
                if not title:
                    continue

                display_text = f"{title} - {artist_name}"
                if is_hebrew(title) or is_hebrew(artist_name):
                    display_text = reverse_hebrew_words(display_text)
                
                query = f"{title} {artist_name}"
                songs.append({
                    "display": display_text,
                    "query": query,
                    "title": title,
                    "artist": artist_name,
                    "preview_url": track.get("preview")
                })
            
            logger.info(f"Returning {len(songs)} songs from Deezer playlist '{res['name']}'")
            return {
                "name": res["name"],
                "owner": res["owner"],
                "songs": songs,
                "url": req.url
            }
        except Exception as e:
            logger.exception("Error extracting Deezer playlist")
            raise HTTPException(status_code=400, detail=f"Failed to extract Deezer playlist: {str(e)}")

    # Fallback to Spotify playlist extraction
    playlist_id = extract_playlist_id(req.url)
    if not playlist_id:
        logger.warning(f"Could not extract playlist ID from URL: {req.url}")
        raise HTTPException(status_code=400, detail="Invalid Spotify or Deezer playlist URL")

    logger.info(f"Extracted Spotify playlist ID: {playlist_id}")
    try:
        playlist = sp.playlist(playlist_id)
        name = playlist.get("name", "Unknown Playlist")
        owner = playlist.get("owner", {}).get("display_name", "")
        logger.info(f"Fetched playlist: {name} by {owner}")

        # Fetch all tracks (pagination)
        tracks = []
        results = sp.playlist_tracks(playlist_id, limit=100, offset=0)
        if results and "items" in results:
            tracks.extend(results["items"])
            logger.info(f"Fetched {len(results['items'])} tracks (first page)")
            while results.get("next"):
                results = sp.next(results)
                if results and "items" in results:
                    tracks.extend(results["items"])
                    logger.info(f"Fetched {len(results['items'])} more tracks (pagination)")

        songs = []
        for item in tracks:
            if not item or not isinstance(item, dict):
                continue
            track = item.get("track")
            if not track or not isinstance(track, dict):
                continue
            
            title = track.get("name")
            artists = track.get("artists")
            if not title or not artists or not isinstance(artists, list) or len(artists) == 0:
                continue

            artist_name = artists[0].get("name", "Unknown Artist")
            display_text = f"{title} - {artist_name}"
            
            if is_hebrew(title) or is_hebrew(artist_name):
                display_text = reverse_hebrew_words(display_text)
            
            query = f"{title} {artist_name}"
            songs.append({
                "display": display_text,
                "query": query,
                "title": title,
                "artist": artist_name,
                "spotify_id": track.get("id")
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

@app.post("/get_preview")
def get_preview(req: PreviewRequest):
    logger.info(f"Received preview request: artist='{req.artist}', title='{req.title}', query='{req.query}'")
    
    artist = req.artist
    title = req.title
    query = req.query

    # Fallback to parsing query if artist/title are empty
    if (not artist or not title) and query:
        if " - " in query:
            parts = query.split(" - ", 1)
            title = parts[0].strip()
            artist = parts[1].strip()
        else:
            title = query.strip()

    preview_data = get_deezer_preview(artist=artist, title=title, query=query)
    
    if not preview_data or not preview_data.get("preview_url"):
        logger.warning(f"No preview found on Deezer for '{artist}' - '{title}'")
        raise HTTPException(status_code=404, detail="Preview not available on Deezer")

    logger.info(f"Returning Deezer preview URL: {preview_data['preview_url']}")
    return {
        "preview_url": preview_data["preview_url"],
        "mp3_url": preview_data["preview_url"],  # Backward-compatibility field
        "title": preview_data.get("title"),
        "artist": preview_data.get("artist"),
        "cover_medium": preview_data.get("cover_medium"),
        "cover_big": preview_data.get("cover_big"),
        "duration": preview_data.get("duration", 30)
    }

# Backward compatibility alias for download_mp3
@app.post("/download_mp3")
def download_mp3(req: PreviewRequest):
    return get_preview(req)

@app.get("/proxy_preview")
def proxy_preview(url: str = Query(..., description="Deezer preview CDN URL")):
    """
    Proxies preview audio from Deezer CDN in case of client-side network or CORS restrictions.
    """
    if not url.startswith("https://") or "dzcdn.net" not in url:
        raise HTTPException(status_code=400, detail="Invalid preview URL")
    
    try:
        resp = requests.get(url, stream=True, timeout=10)
        return StreamingResponse(
            resp.iter_content(chunk_size=8192),
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=3600"
            }
        )
    except Exception as e:
        logger.error(f"Error proxying Deezer preview: {e}")
        raise HTTPException(status_code=502, detail="Failed to proxy preview stream")

@app.post("/delete_mp3")
async def delete_mp3(request: Request):
    """
    No-op stub kept for frontend compatibility. Previews are streamed dynamically with no local storage.
    """
    return {"status": "ok", "message": "No local file cleanup required"}

if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    import uvicorn
    uvicorn.run("backend.src.main:app", host="0.0.0.0", port=8000, reload=True)