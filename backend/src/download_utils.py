import os
import subprocess
import logging

logger = logging.getLogger("spotify_songless")

def download_song(query, output_dir=None):
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
    # We use --output to specify the directory and a format that ensures we can find it, 
    # but spotdl's default naming is usually fine. 
    # We'll use a specific format to avoid ambiguity if possible, but simple directory is safer for now.
    
    command = [
        "spotdl", 
        "download", 
        query, 
        "--output", 
        output_dir
    ]

    try:
        # Run spotdl
        result = subprocess.run(
            command, 
            check=True, 
            capture_output=True, 
            text=True
        )
        logger.info(f"spotdl output: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"spotdl failed: {e.stderr}")
        return None

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
