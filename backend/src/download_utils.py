import os
import subprocess
import logging
import sys

logger = logging.getLogger("spotify_songless")

def download_song(query, output_dir=None, ffmpeg_path=None):
    """
    Downloads a song using spotdl based on the query.
    Returns the absolute path to the downloaded MP3 file.
    """
    if output_dir is None:
        output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../music_files"))
    
    os.makedirs(output_dir, exist_ok=True)

    logger.info(f"Attempting to download query: {query} using spotdl")
    
    # Construct the command
    # spotdl download [query] --output [output_dir]
    # We use sys.executable -m spotdl to ensure we use the installed module in the current environment
    
    # Path to cookies.txt
    cookies_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "cookies.txt"))

    command = [
        sys.executable,
        "-m",
        "spotdl", 
        "download", 
        query, 
        "--output", 
        output_dir,
        "--log-level",
        "DEBUG",
        "--cookie-file",
        cookies_path,
        "--audio",
        "soundcloud",
        "youtube",
        "youtube-music",
        "--yt-dlp-args",
        "--user-agent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'"
    ]

    if ffmpeg_path:
        command.extend(["--ffmpeg", ffmpeg_path])

    logger.info(f"Running command: {' '.join(command)}")

    try:
        # Run spotdl
        result = subprocess.run(
            command, 
            check=True, 
            capture_output=True, 
            text=True
        )
        logger.info(f"spotdl output: {result.stdout}")
        
        # Check for known error strings in stdout even if exit code was 0
        if "AudioProviderError" in result.stdout or "DownloadError" in result.stdout:
            error_msg = f"spotdl reported an error despite success code.\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
    except subprocess.CalledProcessError as e:
        error_msg = f"spotdl failed with code {e.returncode}.\nSTDOUT: {e.stdout}\nSTDERR: {e.stderr}"
        logger.error(error_msg)
        raise Exception(error_msg)

    # Find the most recently created mp3 file in the output directory
    # This is a heuristic, but spotdl doesn't easily return the filename in a machine-readable way via CLI
    try:
        mp3_files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.endswith('.mp3')]
        if not mp3_files:
            logger.error("No MP3 files found in output directory after download.")
            # Try Cobalt Fallback
            logger.info("Spotdl failed to produce a file. Attempting Cobalt fallback...")
            return download_with_cobalt(query, output_dir)
        
        # Get the newest file
        newest_mp3 = max(mp3_files, key=os.path.getctime)
        logger.info(f"Found newest MP3: {newest_mp3}")
        return newest_mp3
    except Exception as e:
        logger.error(f"Error finding downloaded file: {e}")
        return None

def download_with_cobalt(query, output_dir):
    """
    Uses the Cobalt API to download audio from YouTube, bypassing local IP blocks.
    1. Resolves query to YouTube URL using yt-dlp (get-id).
    2. Sends URL to Cobalt API.
    3. Downloads the file from the returned link.
    """
    logger.info(f"Starting Cobalt download for: {query}")
    try:
        # 1. Get YouTube URL
        # We use yt-dlp to search because it's already installed and good at searching.
        # We only ask for the ID to minimize traffic/blocking risk.
        cmd = [
            sys.executable, "-m", "yt_dlp", 
            f"ytsearch1:{query}", 
            "--get-id", 
            "--no-warnings",
            "--no-playlist"
        ]
        
        # Add User-Agent to search request too, just in case
        cmd.extend(["--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"])

        logger.info("Resolving YouTube ID...")
        proc = subprocess.run(cmd, capture_output=True, text=True)
        
        if proc.returncode != 0:
            logger.error(f"Failed to find video ID: {proc.stderr}")
            raise Exception("Could not find video ID")
            
        video_id = proc.stdout.strip()
        if not video_id:
            raise Exception("yt-dlp returned empty video ID")
            
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        logger.info(f"Resolved URL: {youtube_url}")

        # 2. Call Cobalt API
        # Using a public instance. In production, you might want to host your own or rotate instances.
        # api.cobalt.tools is the main one.
        cobalt_api = "https://api.cobalt.tools/api/json"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        payload = {
            "url": youtube_url,
            "aFormat": "mp3",
            "isAudioOnly": True
        }
        
        logger.info("Requesting download link from Cobalt...")
        import requests
        response = requests.post(cobalt_api, json=payload, headers=headers)
        
        if response.status_code != 200:
            logger.error(f"Cobalt API error: {response.status_code} - {response.text}")
            raise Exception(f"Cobalt API returned {response.status_code}")
            
        data = response.json()
        download_url = data.get("url")
        
        if not download_url:
            logger.error(f"Cobalt response missing URL: {data}")
            raise Exception("Cobalt did not return a download URL")
            
        logger.info("Got download link from Cobalt. Downloading file...")
        
        # 3. Download the file
        # We need a filename. Let's use the query or video ID.
        # Sanitize filename
        safe_filename = "".join([c for c in query if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        filename = f"{safe_filename}.mp3"
        filepath = os.path.join(output_dir, filename)
        
        with requests.get(download_url, stream=True) as r:
            r.raise_for_status()
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    f.write(chunk)
                    
        logger.info(f"Cobalt download successful: {filepath}")
        return filepath

    except Exception as e:
        logger.exception("Cobalt fallback failed")
        raise Exception(f"Cobalt fallback failed: {str(e)}")
