# SpotifySongless

SpotifySongless is a web app for extracting songs from a Spotify playlist, searching for their lyric versions on YouTube, downloading them as MP3s, and playing them in your browser.  
It uses a **React frontend** and a **FastAPI backend**.

---

## Features

- Paste a Spotify playlist URL and extract all song titles and artists.
- Search YouTube for each song (with "lyrics" appended).
- Download the top YouTube result as an MP3 (audio only).
- Play the downloaded MP3 directly in the browser.
- Hebrew support (with font and RTL handling).

---

## Requirements

### Backend

- Python 3.8+
- [ffmpeg](https://ffmpeg.org/) (must be in your PATH)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FastAPI](https://fastapi.tiangolo.com/)
- [spotipy](https://spotipy.readthedocs.io/)
- [requests](https://docs.python-requests.org/)
- [uvicorn](https://www.uvicorn.org/)

### Frontend

- [Node.js](https://nodejs.org/) (includes npm)
- [React](https://react.dev/) (created with Create React App or Vite)

---

## Installation

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/SpotifySongless.git
cd SpotifySongless
```

### 2. Backend Setup

```sh
cd backend/src
python3 -m venv ../../.venv
source ../../.venv/bin/activate
pip install fastapi uvicorn spotipy yt-dlp requests
# Install ffmpeg (Ubuntu example)
sudo apt install ffmpeg
```

### 3. Frontend Setup

```sh
cd ../../frontend
npm install
```

---

## Usage

### 1. Start the backend

```sh
cd backend/src
python main.py
```
- The backend will be available at [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Start the frontend

```sh
cd frontend
npm start
```
- The frontend will be available at [http://localhost:3000](http://localhost:3000)

---

## File Structure

```
SpotifySongless/
├── backend/
│   └── src/
│       ├── main.py                # FastAPI backend
│       ├── spotify_utils.py       # Spotify API helpers
│       ├── youtube_utils.py       # YouTube search/download helpers
│       └── music_files/           # Downloaded MP3s (gitignored)
├── frontend/
│   ├── src/
│   │   └── App.js                 # React frontend
│   ├── node_modules/
│   ├── package.json
│   └── ...
├── requirements.txt               # (optional, for backend)
├── .gitignore
└── README.md
```

---

## Troubleshooting

- **No audio playback:**  
  - Make sure `ffmpeg` is installed and in your PATH.
- **CORS errors:**  
  - The backend enables CORS for all origins by default.
- **App crashes on download:**  
  - All UI updates are handled on the frontend; backend errors will be shown in the browser.

---

## License

MIT License

---

## Credits

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/)
- [spotipy](https://spotipy.readthedocs.io/)

---

**Enjoy your music!**
