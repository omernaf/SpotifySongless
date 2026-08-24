import re
import json
import logging
import requests
from urllib.parse import urlparse, parse_qs

from backend.src.spotify_utils import sp, extract_playlist_id, is_hebrew, reverse_hebrew_words, resolve_music_url
from backend.src.deezer_utils import (
    extract_deezer_playlist_id,
    extract_deezer_playlist,
    clean_track_title
)

logger = logging.getLogger("spotify_songless")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+111;"
}

def clean_youtube_title(title: str, artist: str = "") -> str:
    """
    Cleans YouTube video titles (e.g. 'Artist - Title (Official Video)') into clean track titles.
    """
    if not title:
        return ""
    
    # If title has "Artist - Title", remove artist prefix if it matches
    if " - " in title:
        parts = title.split(" - ", 1)
        if artist and (artist.lower() in parts[0].lower() or parts[0].lower() in artist.lower()):
            title = parts[1]
        else:
            title = parts[1]

    # Remove common video suffixes
    title = re.sub(
        r'[\(\[\-]?\s*(?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|lyrics?|visualizer|audio|4k|hd|remastered|mv)\s*[\)\]]?',
        '',
        title,
        flags=re.IGNORECASE
    )
    # Further clean with general title cleaner
    return clean_track_title(title)

def extract_apple_music_playlist(url: str) -> dict:
    """
    Extracts songs from public Apple Music playlist URL.
    """
    logger.info(f"Extracting Apple Music playlist from: {url}")
    resp = requests.get(url, headers=HEADERS, timeout=12)
    if resp.status_code != 200:
        raise Exception(f"Apple Music returned HTTP {resp.status_code}")

    match = re.search(r'<script[^>]*id=["\']serialized-server-data["\'][^>]*>([\s\S]*?)</script>', resp.text)
    if not match:
        # Fallback to schema.org scripts
        schema_scripts = re.findall(r'<script\b[^>]*>([\s\S]*?)</script>', resp.text)
        for s in schema_scripts:
            if "schema.org" in s and "MusicPlaylist" in s:
                try:
                    data = json.loads(s.strip())
                    name = data.get("name", "Apple Music Playlist")
                    tracks = []
                    for t in data.get("track", []):
                        t_name = t.get("name")
                        by_artist = t.get("byArtist", {})
                        a_name = by_artist.get("name") if isinstance(by_artist, dict) else "Unknown Artist"
                        if t_name:
                            tracks.append({"title": t_name, "artist": a_name})
                    if tracks:
                        return {"name": name, "owner": "Apple Music", "tracks": tracks}
                except Exception:
                    pass
        raise Exception("Could not find playlist data in Apple Music page")

    data = json.loads(match.group(1).strip())
    sections = data.get("data", [{}])[0].get("data", {}).get("sections", [])
    
    name = "Apple Music Playlist"
    owner = "Apple Music"
    tracks = []

    for sec in sections:
        sec_id = sec.get("id", "")
        if "header" in sec_id and sec.get("items"):
            name = sec["items"][0].get("title", name)
        if "track-list" in sec_id or sec_id.startswith("track-"):
            for it in sec.get("items", []):
                t = it.get("title")
                a = it.get("artistName")
                if not a and "subtitleLinks" in it and len(it["subtitleLinks"]) > 0:
                    a = it["subtitleLinks"][0].get("title")
                if not a and "subtitle" in it:
                    a = it.get("subtitle")
                if t:
                    tracks.append({"title": t, "artist": a or "Unknown Artist"})

    logger.info(f"Extracted {len(tracks)} tracks from Apple Music playlist '{name}'")
    return {"name": name, "owner": owner, "tracks": tracks}

def extract_youtube_playlist(url: str) -> dict:
    """
    Extracts songs from public YouTube or YouTube Music playlist URL.
    """
    logger.info(f"Extracting YouTube/YouTube Music playlist from: {url}")
    
    # Extract playlist ID from URL
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    playlist_id = params.get("list", [None])[0]
    
    if not playlist_id and "youtu.be" in parsed.netloc:
        playlist_id = params.get("list", [None])[0]

    # Standardize URL to standard youtube playlist
    fetch_url = f"https://www.youtube.com/playlist?list={playlist_id}" if playlist_id else url

    resp = requests.get(fetch_url, headers=HEADERS, timeout=12)
    if resp.status_code != 200:
        raise Exception(f"YouTube returned HTTP {resp.status_code}")

    m = re.search(r'ytInitialData\s*=\s*({[\s\S]+?});\s*</script>', resp.text)
    if not m:
        m = re.search(r'var\s+ytInitialData\s*=\s*({.+?});', resp.text)
    if not m:
        raise Exception("Could not find ytInitialData in YouTube response")

    data = json.loads(m.group(1))

    # Extract playlist name
    name = "YouTube Playlist"
    try:
        name = data["metadata"]["playlistMetadataRenderer"]["title"]
    except Exception:
        try:
            name = data["microformat"]["microformatDataRenderer"]["title"]
        except Exception:
            pass

    def find_videos(node):
        res = []
        if isinstance(node, dict):
            if "lockupViewModel" in node:
                vm = node["lockupViewModel"]
                meta = vm.get("metadata", {}).get("lockupMetadataViewModel", {})
                title_obj = meta.get("title", {})
                t = title_obj.get("content") or title_obj.get("runs", [{}])[0].get("text")
                artist_obj = meta.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                a = "Unknown Artist"
                if artist_obj and len(artist_obj) > 0:
                    runs = artist_obj[0].get("metadataParts", [{}])[0].get("text", {}).get("content")
                    if runs:
                        a = runs
                if t:
                    res.append({"title": clean_youtube_title(t, a), "artist": a})
            elif "playlistVideoRenderer" in node:
                v = node["playlistVideoRenderer"]
                t = v.get("title", {}).get("runs", [{}])[0].get("text") or v.get("title", {}).get("simpleText")
                a = v.get("shortBylineText", {}).get("runs", [{}])[0].get("text") or v.get("shortBylineText", {}).get("simpleText") or "Unknown Artist"
                if t and t not in ["[Deleted video]", "[Private video]"]:
                    res.append({"title": clean_youtube_title(t, a), "artist": a})
            elif "musicResponsiveListItemRenderer" in node:
                # YouTube Music track row
                r = node["musicResponsiveListItemRenderer"]
                flex_cols = r.get("flexColumns", [])
                t = None
                a = "Unknown Artist"
                if len(flex_cols) > 0:
                    runs = flex_cols[0].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    if runs:
                        t = runs[0].get("text")
                if len(flex_cols) > 1:
                    runs = flex_cols[1].get("musicResponsiveListItemFlexColumnRenderer", {}).get("text", {}).get("runs", [])
                    if runs:
                        a = runs[0].get("text")
                if t:
                    res.append({"title": clean_youtube_title(t, a), "artist": a})
            for k, v in node.items():
                res.extend(find_videos(v))
        elif isinstance(node, list):
            for item in node:
                res.extend(find_videos(item))
        return res

    tracks = find_videos(data)
    logger.info(f"Extracted {len(tracks)} tracks from YouTube playlist '{name}'")
    return {"name": name, "owner": "YouTube", "tracks": tracks}

def extract_universal_playlist(url: str) -> dict:
    """
    Unified entry point for playlist extraction.
    Supports Spotify, Deezer, Apple Music, and YouTube Music / YouTube URLs.
    """
    resolved_url = resolve_music_url(url)
    lower_url = resolved_url.lower()

    # 1. Deezer
    deezer_id = extract_deezer_playlist_id(resolved_url)
    if deezer_id:
        res = extract_deezer_playlist(deezer_id)
        songs = []
        for track in res["raw_tracks"]:
            title = track.get("title")
            artist_name = track.get("artist", {}).get("name", "Unknown Artist")
            if not title:
                continue

            display_text = f"{title} - {artist_name}"
            if is_hebrew(title) or is_hebrew(artist_name):
                display_text = reverse_hebrew_words(display_text)
            
            songs.append({
                "display": display_text,
                "query": f"{title} {artist_name}",
                "title": title,
                "artist": artist_name,
                "preview_url": track.get("preview")
            })
        return {
            "name": res["name"],
            "owner": res["owner"],
            "songs": songs,
            "url": url
        }

    # 2. Apple Music
    if "music.apple.com" in lower_url and "/playlist/" in lower_url:
        res = extract_apple_music_playlist(resolved_url)
        songs = []
        for track in res["tracks"]:
            title = track["title"]
            artist_name = track["artist"]
            display_text = f"{title} - {artist_name}"
            if is_hebrew(title) or is_hebrew(artist_name):
                display_text = reverse_hebrew_words(display_text)
            songs.append({
                "display": display_text,
                "query": f"{title} {artist_name}",
                "title": title,
                "artist": artist_name
            })
        return {
            "name": res["name"],
            "owner": res["owner"],
            "songs": songs,
            "url": url
        }

    # 3. YouTube / YouTube Music
    if ("youtube.com" in lower_url or "youtu.be" in lower_url or "music.youtube.com" in lower_url) and ("list=" in lower_url or "/playlist" in lower_url):
        res = extract_youtube_playlist(resolved_url)
        songs = []
        for track in res["tracks"]:
            title = track["title"]
            artist_name = track["artist"]
            display_text = f"{title} - {artist_name}"
            if is_hebrew(title) or is_hebrew(artist_name):
                display_text = reverse_hebrew_words(display_text)
            songs.append({
                "display": display_text,
                "query": f"{title} {artist_name}",
                "title": title,
                "artist": artist_name
            })
        return {
            "name": res["name"],
            "owner": res["owner"],
            "songs": songs,
            "url": url
        }

    # 4. Spotify
    playlist_id = extract_playlist_id(resolved_url)
    if playlist_id:
        playlist = sp.playlist(playlist_id)
        name = playlist.get("name", "Unknown Playlist")
        owner = playlist.get("owner", {}).get("display_name", "")

        tracks = []
        results = sp.playlist_tracks(playlist_id, limit=100, offset=0)
        if results and "items" in results:
            tracks.extend(results["items"])
            while results.get("next"):
                results = sp.next(results)
                if results and "items" in results:
                    tracks.extend(results["items"])

        songs = []
        for item in tracks:
            if not item or not isinstance(item, dict):
                continue
            track = item.get("track")
            if not track or not isinstance(track, dict):
                continue
            
            title = track.get("name")
            artists = track.get("artists")
            if not title or not artists or not isinstance(artists, list) or len(artists) == 0:
                continue

            artist_name = artists[0].get("name", "Unknown Artist")
            display_text = f"{title} - {artist_name}"
            
            if is_hebrew(title) or is_hebrew(artist_name):
                display_text = reverse_hebrew_words(display_text)
            
            songs.append({
                "display": display_text,
                "query": f"{title} {artist_name}",
                "title": title,
                "artist": artist_name,
                "spotify_id": track.get("id")
            })

        return {
            "name": name,
            "owner": owner,
            "songs": songs,
            "url": url
        }

    raise Exception("Unsupported or invalid playlist URL. Supported: Spotify, Deezer, Apple Music, YouTube Music.")
