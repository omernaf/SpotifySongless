# SpotifySongless

SpotifySongless is a song guessing game web app. Paste any playlist URL from **Spotify**, **Apple Music**, **YouTube Music**, or **Deezer**, and the app will pick a random song and play incrementally increasing snippets (0.5s, 1s, 2s, 4s, 8s, 15s, full preview) for you to guess!

It features instant streaming of 30-second official preview clips via the free Deezer API (no illegal YouTube downloads, no local file storage, zero audio conversion overhead).

---

## Features

- **Multi-Platform Playlist Support**:
  - **Spotify**: Full playlist URLs, shortened links (`spotify.link`, `spoti.fi`), and `spotify:playlist:...` URIs.
  - **Apple Music**: Public playlist links (`music.apple.com/.../playlist/...`).
  - **YouTube / YouTube Music**: Playlist links (`music.youtube.com/playlist?list=...` or `youtube.com/playlist?list=...`).
  - **Deezer**: Playlist URLs and IDs (`deezer.com/playlist/...`).
- **Instant Preview Streaming**: Uses the free Deezer API to search and stream high-quality 30s highlight preview clips instantly with zero auth required.
- **Smart Song Sanitization**: Automatic cleanup of remaster dates, live, deluxe, and featured artist tags for accurate track matching.
- **Hebrew & RTL Support**: Full support for Hebrew titles with bidirectional rendering.
- **Lightweight Architecture**: No YouTube scraping, no `yt-dlp`/`spotdl`, no `ffmpeg` required, zero disk footprint.

---

## Architecture

- **Backend**: Python 3.10+ / [FastAPI](https://fastapi.tiangolo.com/) + [spotipy](https://spotipy.readthedocs.io/) + [requests](https://docs.python-requests.org/)
- **Frontend**: [React](https://react.dev/) with HTML5 Audio & autocomplete search

---

## Getting Started

### 1. Backend Setup

```sh
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn backend.src.main:app --port 8000 --reload
```
- Backend API will be live at: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend Setup

```sh
cd frontend
npm install
npm start
```
- Frontend will open at: [http://localhost:3000](http://localhost:3000)

---

## API Endpoints

- `POST /extract_songs`: Extracts all tracks from a Spotify, Apple Music, YouTube Music, or Deezer playlist URL.
- `POST /get_preview`: Fetches Deezer preview MP3 URL for a given artist/title.
- `GET /proxy_preview?url=...`: Optional proxy stream for preview audio.

---

## License

MIT License
