from kivy.clock import Clock

class MyLogger:
    def debug(self, msg): pass
    def warning(self, msg): pass
    def error(self, msg): pass

def open_top_youtube_result(query, status_label=None, progress_bar=None):
    import requests, os, yt_dlp, re
    from kivy.clock import Clock

    search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}+(lyrics)"
    try:
        response = requests.get(search_url, headers={'User-Agent': 'Mozilla/5.0'})
        video_ids = re.findall(r"watch\?v=(\S{11})", response.text)
        if video_ids:
            top_url = f"https://www.youtube.com/watch?v={video_ids[0]}"
            output_dir = "music_files"
            os.makedirs(output_dir, exist_ok=True)

            mp3_path_holder = {}

            def progress_hook(d):
                # Set path after postprocessing (preferred)
                if d.get('status') == 'postprocessing' and d.get('postprocessor') == 'FFmpegExtractAudio':
                    mp3_path_holder['path'] = d['filename']
                # Fallback: set path on finished if not already set
                if d.get('status') == 'finished' and 'path' not in mp3_path_holder and d.get('filename', '').endswith('.mp3'):
                    mp3_path_holder['path'] = d['filename']
                # Progress bar update
                if d.get('status') == 'downloading' and progress_bar:
                    total = d.get('total_bytes') or d.get('total_bytes_estimate')
                    downloaded = d.get('downloaded_bytes')
                    if total and downloaded:
                        percent = 100 * downloaded / total
                        Clock.schedule_once(lambda dt: setattr(progress_bar, 'value', percent))
                if d.get('status') == 'finished' and progress_bar:
                    Clock.schedule_once(lambda dt: setattr(progress_bar, 'value', 100))

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
                'logger': MyLogger(),
                'progress_hooks': [progress_hook],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([top_url])
            if status_label:
                Clock.schedule_once(lambda dt: setattr(status_label, 'text', "Download complete!"))
            if progress_bar:
                Clock.schedule_once(lambda dt: setattr(progress_bar, 'value', 0), 1)
            print("Returning MP3 path:", mp3_path_holder.get('path'))  # Debug print
            return mp3_path_holder.get('path')
        else:
            if status_label:
                Clock.schedule_once(lambda dt: setattr(status_label, 'text', "No YouTube results found."))
            return None
    except Exception as e:
        if status_label:
            Clock.schedule_once(lambda dt: setattr(status_label, 'text', f"Error downloading: {str(e)}"))
        if progress_bar:
            Clock.schedule_once(lambda dt: setattr(progress_bar, 'value', 0), 1)
        return None