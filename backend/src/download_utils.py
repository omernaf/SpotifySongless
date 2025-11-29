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
        "--audio-providers",
        "soundcloud",
        "piped",
        "youtube-music"
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
            return None
        
        # Get the newest file
        newest_mp3 = max(mp3_files, key=os.path.getctime)
        logger.info(f"Found newest MP3: {newest_mp3}")
        return newest_mp3
    except Exception as e:
        logger.error(f"Error finding downloaded file: {e}")
        return None
