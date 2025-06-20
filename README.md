# SpotifySongless

SpotifySongless is a desktop app (Kivy) for extracting songs from a Spotify playlist, searching for their lyric versions on YouTube, downloading them as MP3s, and playing them locally.  
It uses the Spotify API, yt-dlp, and ffmpeg.

---

## Features

- Paste a Spotify playlist URL and extract all song titles and artists.
- Search YouTube for each song (with "lyrics" appended).
- Download the top YouTube result as an MP3 (audio only).
- Show download progress with a progress bar.
- Play the downloaded MP3 directly in the app.
- Hebrew support (with font and RTL handling).

---

## Requirements

- Python 3.8+
- [ffmpeg](https://ffmpeg.org/) (must be in your PATH)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Kivy](https://kivy.org/)
- [spotipy](https://spotipy.readthedocs.io/)
- [requests](https://docs.python-requests.org/)
- (Optional, for better audio) [ffpyplayer](https://github.com/matham/ffpyplayer)

---

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/yourusername/SpotifySongless.git
    cd SpotifySongless
    ```

2. **Create a virtual environment:**
    ```sh
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3. **Install dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

4. **Install ffmpeg:**
    - On Ubuntu/Debian:
      ```sh
      sudo apt install ffmpeg
      ```
    - On Mac:
      ```sh
      brew install ffmpeg
      ```
    - On Windows:  
      Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

---

## Usage

1. **Run the app:**
    ```sh
    python main.py
    ```

2. **Paste a Spotify playlist URL** into the input box.

3. **Click "Extract Songs"** to see the list of songs.

4. **Click a song** to download its lyric version from YouTube as an MP3.

5. **Wait for the progress bar to finish.** The song will play automatically after download.

---

## File Structure

```
SpotifySongless/
├── main.py                # Main Kivy app logic
├── spotify_utils.py       # Spotify API helpers
├── youtube_utils.py       # YouTube search/download helpers
├── ui.py                  # Kivy UI layout
├── fonts/                 # Hebrew font(s)
├── music_files/           # Downloaded MP3s (gitignored)
├── requirements.txt
├── .gitignore
```

---

## Configuration

- **Spotify API keys** are set in `spotify_utils.py`.  
  You may need to [register your own Spotify app](https://developer.spotify.com/dashboard/applications) and update the credentials.

- **Font:**  
  The app uses `fonts/Rubik-VariableFont_wght.ttf` for Hebrew support.  
  You can change this in `main.py` and `ui.py`.

---

## Troubleshooting

- **No audio playback:**  
  - Make sure `ffmpeg` is installed and in your PATH.
  - Try installing `ffpyplayer` for better MP3 support:  
    `pip install ffpyplayer`
- **Progress bar doesn't move:**  
  - Try downloading a larger file.
  - Make sure you are not running the app as root (Kivy graphics may fail).
- **App crashes on download:**  
  - All UI updates must be done on the main thread.  
    This is already handled in the latest code.

---

## License

MIT License

---

## Credits

- [Kivy](https://kivy.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/)
- [spotipy](https://spotipy.readthedocs.io/)
- [Rubik font](https://fonts.google.com/specimen/Rubik)

---

## TODO

- [ ] Add support for album/artist links.
- [ ] Add web version (React + FastAPI).
- [ ] Show download errors in a popup.
- [ ] Add settings for output folder and audio quality.

---

**Enjoy your music!**
