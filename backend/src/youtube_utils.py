import os
import yt_dlp
import requests
import re

class MyLogger:
    def debug(self, msg): pass
    def warning(self, msg): pass
    def error(self, msg): pass

def open_top_youtube_result(query, status_label=None, progress_bar=None):
    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}+lyrics"
    response = requests.get(search_url, headers={'User-Agent': 'Mozilla/5.0'})
    video_ids = re.findall(r"watch\?v=(\S{11})", response.text)
    if not video_ids:
        # If running in backend, just print/log the error
        if status_label is not None:
            print("No YouTube results found.")
        return None

    top_url = f"https://www.youtube.com/watch?v={video_ids[0]}"
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../music_files"))
    os.makedirs(output_dir, exist_ok=True)

    mp3_path_holder = {}

    def progress_hook(d):
        # Set path after postprocessing (when MP3 is ready)
        if d.get('status') == 'finished' and d.get('filename', '').endswith('.mp3'):
            mp3_path_holder['path'] = d['filename']
        if d.get('status') == 'postprocessing' and d.get('postprocessor') == 'FFmpegExtractAudio':
            mp3_path_holder['path'] = d['filename']

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
        'noplaylist': True,
        'progress_hooks': [progress_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([top_url])
    if status_label is not None:
        print("Download complete!")
    if progress_bar is not None:
        print("Progress bar reset (not applicable in backend).")

    # Fallback: find the newest mp3 in output_dir if hook failed
    mp3_path = mp3_path_holder.get('path')
    if not mp3_path:
        mp3_files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith('.mp3')]
        if mp3_files:
            mp3_path = max(mp3_files, key=os.path.getctime)
    print("Returning MP3 path:", mp3_path)
    return mp3_path