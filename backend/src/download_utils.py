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
        # Check for known error strings in stdout even if exit code was 0
        if "AudioProviderError" in result.stdout or "DownloadError" in result.stdout:
            logger.warning(f"spotdl reported an error. Triggering Cobalt fallback. Output: {result.stdout}")
            return download_with_cobalt(query, output_dir)
            
    except subprocess.CalledProcessError as e:
        logger.warning(f"spotdl failed with code {e.returncode}. Triggering Cobalt fallback.")
        return download_with_cobalt(query, output_dir)

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
        # Path to cookies.txt
        cookies_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "cookies.txt"))

        base_cmd = [
            sys.executable, "-m", "yt_dlp", 
            f"ytsearch1:{query}", 
            "--get-id", 
            "--no-warnings",
            "--no-playlist"
        ]
        
        # Add User-Agent
        base_cmd.extend(["--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"])

        # Attempt 1: With cookies
        cmd = base_cmd + ["--cookies", cookies_path]
        
        logger.info("Resolving YouTube ID (Attempt 1 with cookies)...")
        proc = subprocess.run(cmd, capture_output=True, text=True)
        logger.debug(f"yt-dlp search stdout: {proc.stdout}")
        logger.debug(f"yt-dlp search stderr: {proc.stderr}")

        # Retry without cookies if usage error (code 2)
        if proc.returncode == 2:
            logger.warning("yt-dlp rejected cookies argument. Retrying without cookies...")
            cmd = base_cmd
            proc = subprocess.run(cmd, capture_output=True, text=True)
            logger.debug(f"yt-dlp retry stdout: {proc.stdout}")
            logger.debug(f"yt-dlp retry stderr: {proc.stderr}")

        video_id = None
        
        if proc.returncode == 0:
            video_id = proc.stdout.strip()
        else:
            logger.warning(f"yt-dlp search failed with code {proc.returncode}. Attempting to recover ID from output...")
            # Try to extract ID from stderr: [youtube] <ID>: Sign in to confirm...
            import re
            match = re.search(r'\[youtube\] ([a-zA-Z0-9_-]{11}):', proc.stderr)
            if match:
                video_id = match.group(1)
                logger.info(f"Recovered Video ID from stderr: {video_id}")
            else:
                # Also check stdout just in case
                if proc.stdout.strip():
                     video_id = proc.stdout.strip().split('\n')[0]
                     logger.info(f"Recovered Video ID from stdout: {video_id}")

        if not video_id:
            logger.error(f"Failed to find video ID: {proc.stderr}")
            raise Exception("Could not find video ID")
            
        youtube_url = f"https://www.youtube.com/watch?v={video_id}"
        logger.info(f"Resolved URL: {youtube_url}")

        # 2. Call Cobalt API
        # api.cobalt.tools is shut down. We use a list of community instances.
        # Source: https://instances.cobalt.best/
        cobalt_instances = [
            "https://cobalt-api.meowing.de",
            "https://cobalt-backend.canine.tools",
            "https://kityune.imput.net",
            "https://capi.3kh0.net",
            "https://nachos.imput.net",
            "https://sunny.imput.net"
        ]
        
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
        
        download_url = None
        import requests

        for instance_base in cobalt_instances:
            # v10+ API uses POST / (root) instead of /api/json
            api_url = instance_base
            if not api_url.endswith("/"):
                api_url += "/"
            logger.info(f"Requesting download link from Cobalt instance: {instance_base}...")
            try:
                response = requests.post(api_url, json=payload, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    download_url = data.get("url")
                    if download_url:
                        logger.info(f"Successfully got download link from {instance_base}")
                        break
                    else:
                        logger.warning(f"Instance {instance_base} returned 200 but no URL: {data}")
                else:
                    logger.warning(f"Instance {instance_base} failed with status {response.status_code}: {response.text}")
            except Exception as e:
                logger.warning(f"Failed to connect to instance {instance_base}: {e}")
        
        if not download_url:
            raise Exception("All Cobalt instances failed to return a download URL")
            
        logger.info("Got download link from Cobalt. Downloading file...")
        
        # 3. Download the file
        # We need a filename. Let's use the query or video ID.
        # Sanitize filename
        safe_filename = "".join([c for c in query if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        filename = f"{safe_filename}.mp3"
        filepath = os.path.join(output_dir, filename)
        
        logger.debug(f"Output directory content before download: {os.listdir(output_dir)}")
        
        with requests.get(download_url, stream=True) as r:
            r.raise_for_status()
            with open(filepath, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): 
                    f.write(chunk)
        
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            logger.info(f"Cobalt download successful: {filepath} (Size: {file_size} bytes)")
            logger.debug(f"Output directory content after download: {os.listdir(output_dir)}")
        else:
            logger.error(f"File not found after download: {filepath}")
            
        return filepath

    except Exception as e:
        logger.exception("Cobalt fallback failed")
        raise Exception(f"Cobalt fallback failed: {str(e)}")
