import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import re
import requests
from urllib.parse import urlparse

CLIENT_ID = 'c8a7cac32dfe409fbc685d036abc4c6a'
CLIENT_SECRET = '8b7e92c4bc0e47f99b119fd20c36a869'

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

def resolve_music_url(url: str) -> str:
    """
    Expands shortened URLs (such as spotify.link, spotify.app.link, spoti.fi, deezer.page.link)
    by following HTTP redirects or parsing canonical meta tags for playlists and albums.
    """
    if not url:
        return ""
    
    url = url.strip()

    # Handle spotify:playlist: or spotify:album: URI formats
    if url.startswith("spotify:playlist:"):
        playlist_id = url.split(":")[-1]
        return f"https://open.spotify.com/playlist/{playlist_id}"
    if url.startswith("spotify:album:"):
        album_id = url.split(":")[-1]
        return f"https://open.spotify.com/album/{album_id}"

    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    parsed = urlparse(url)
    hostname = parsed.netloc.lower()

    # If it's already an open.spotify.com or deezer.com URL with /playlist/ or /album/, return directly
    if ("open.spotify.com" in hostname or "deezer.com" in hostname) and ("/playlist/" in url or "/album/" in url):
        return url

    # Follow redirects for shortened domains
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        resp = requests.get(url, headers=headers, allow_redirects=True, timeout=10)
        final_url = resp.url

        if "/playlist/" in final_url or "/album/" in final_url:
            return final_url

        # Check HTML for og:url or embedded links if redirected to intermediary landing page
        if resp.text:
            og_match = re.search(r'<meta\s+property=["\']og:url["\']\s+content=["\']([^"\']+)["\']', resp.text, re.IGNORECASE)
            if og_match and ("/playlist/" in og_match.group(1) or "/album/" in og_match.group(1)):
                return og_match.group(1)

            spotify_match = re.search(r'https?://open\.spotify\.com/(playlist|album)/([a-zA-Z0-9]+)', resp.text)
            if spotify_match:
                return spotify_match.group(0)

            deezer_match = re.search(r'https?://(?:www\.)?deezer\.com/(?:[a-z]{2}/)?(playlist|album)/(\d+)', resp.text)
            if deezer_match:
                return deezer_match.group(0)

        return final_url
    except Exception:
        return url

def extract_playlist_id(url):
    match = re.search(r'playlist/([a-zA-Z0-9]+)', url)
    return match.group(1) if match else None

def extract_album_id(url):
    match = re.search(r'album/([a-zA-Z0-9]+)', url)
    return match.group(1) if match else None

def is_hebrew(text):
    for char in text:
        if '\u0590' <= char <= '\u05FF':
            return True
    return False

def reverse_hebrew_words(text):
    def reverse_if_hebrew(word):
        return word[::-1] if is_hebrew(word) else word
    return ' '.join(reverse_if_hebrew(w) for w in text.split(' '))