import re
import time
import logging
import requests

logger = logging.getLogger("spotify_songless")

DEEZER_SEARCH_API = "https://api.deezer.com/search"

def clean_track_title(title: str) -> str:
    """
    Sanitizes track title by removing Spotify metadata tags like:
    - feat. / ft. / with
    - (2011 Remaster), - Remastered 2009, [Live at ...]
    - (Radio Edit), (Deluxe Edition), (Mono / Stereo)
    """
    if not title:
        return ""
    
    # Remove featuring artist tags: (feat. X), [ft. Y], - feat X, etc.
    cleaned = re.sub(r'[\(\[\-]\s*(?:feat\.?|ft\.?|with|prod\.?)\b[^\)\]\-]*[\)\]]?', '', title, flags=re.IGNORECASE)
    
    # Remove remaster / mix / live / deluxe / version / edition / edit / audio / video annotations
    cleaned = re.sub(
        r'[\(\[\-]\s*(?:\d{4}\s*)?(?:remaster(?:ed)?|mix(?:ed)?|live|bonus track|deluxe|version|edit|mono|stereo|anniversary|expanded|re-recorded|soundtrack|official\s*(?:audio|video)?|lyrics?)[^\)\]\-]*[\)\]]?',
        '',
        cleaned,
        flags=re.IGNORECASE
    )
    
    # Remove trailing dashes, quotes or extra whitespace
    cleaned = re.sub(r'\s*-\s*$', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()

def extract_deezer_playlist_id(url_or_id: str) -> str | None:
    """
    Extracts Deezer playlist ID from various URL formats or raw ID string.
    Examples:
    - https://www.deezer.com/en/playlist/5961030064
    - https://deezer.page.link/...
    - 5961030064
    """
    if not url_or_id:
        return None
    url_or_id = url_or_id.strip()
    if url_or_id.isdigit():
        return url_or_id
    match = re.search(r'deezer\.com/(?:[a-z]{2}/)?playlist/(\d+)', url_or_id)
    if match:
        return match.group(1)
    return None

def extract_deezer_playlist(playlist_id: str) -> dict:
    """
    Fetches full Deezer playlist with pagination (handles 1000+ tracks).
    """
    session = requests.Session()
    session.headers.update({"User-Agent": "SpotifySongless/2.0"})

    meta_resp = session.get(f"https://api.deezer.com/playlist/{playlist_id}", timeout=10)
    meta = meta_resp.json()
    if "error" in meta:
        raise Exception(f"Deezer playlist error: {meta['error'].get('message')}")
    
    name = meta.get("title", "Unknown Playlist")
    owner = meta.get("creator", {}).get("name", "")
    
    raw_tracks = []
    url = f"https://api.deezer.com/playlist/{playlist_id}/tracks?limit=100"
    while url:
        resp = session.get(url, timeout=10)
        data = resp.json()
        if "error" in data:
            break
        items = data.get("data", [])
        if not items:
            break
        raw_tracks.extend(items)
        url = data.get("next")
        if url:
            time.sleep(0.05) # Rate limit safety

    thumbnail = meta.get("picture_medium") or meta.get("picture_big") or meta.get("picture_small")

    return {
        "name": name,
        "owner": owner,
        "thumbnail": thumbnail,
        "raw_tracks": raw_tracks
    }

def extract_deezer_album_id(url_or_id: str) -> str | None:
    """
    Extracts numerical Deezer album ID from URL or raw ID string.
    """
    if not url_or_id:
        return None
    url_or_id = url_or_id.strip()
    match = re.search(r'deezer\.com/(?:[a-z]{2}/)?album/(\d+)', url_or_id)
    if match:
        return match.group(1)
    return None

def extract_deezer_album(album_id: str) -> dict:
    """
    Fetches full Deezer album with tracks and metadata.
    """
    session = requests.Session()
    session.headers.update({"User-Agent": "SpotifySongless/2.0"})

    meta_resp = session.get(f"https://api.deezer.com/album/{album_id}", timeout=10)
    meta = meta_resp.json()
    if "error" in meta:
        raise Exception(f"Deezer album error: {meta['error'].get('message')}")
    
    name = meta.get("title", "Unknown Album")
    owner = meta.get("artist", {}).get("name", "")
    thumbnail = meta.get("cover_medium") or meta.get("cover_big") or meta.get("cover_small")
    
    raw_tracks = meta.get("tracks", {}).get("data", [])
    
    return {
        "name": name,
        "owner": owner,
        "thumbnail": thumbnail,
        "raw_tracks": raw_tracks
    }

def get_deezer_preview(artist: str = "", title: str = "", query: str = "") -> dict | None:
    """
    Searches Deezer for a track and returns preview info.
    Uses multi-stage fallback to ensure high matching accuracy.
    """
    clean_t = clean_track_title(title) if title else ""
    artist_clean = artist.strip() if artist else ""

    # Build fallback query chain
    candidate_queries = []
    
    # 1. Structured query with cleaned title and artist
    if artist_clean and clean_t:
        candidate_queries.append(f'artist:"{artist_clean}" track:"{clean_t}"')
    
    # 2. Structured query with original title and artist
    if artist_clean and title and title != clean_t:
        candidate_queries.append(f'artist:"{artist_clean}" track:"{title.strip()}"')
    
    # 3. Plain search with artist and cleaned title
    if artist_clean and clean_t:
        candidate_queries.append(f"{artist_clean} {clean_t}")
        
    # 4. Plain search with original title
    if artist_clean and title and title != clean_t:
        candidate_queries.append(f"{artist_clean} {title.strip()}")
        
    # 5. Raw query fallback if provided
    if query and query.strip() not in candidate_queries:
        candidate_queries.append(query.strip())
        
    # 6. Cleaned title alone as last resort
    if clean_t and clean_t not in candidate_queries:
        candidate_queries.append(clean_t)

    logger.info(f"Searching Deezer for artist='{artist}', title='{title}'. Queries to try: {candidate_queries}")

    session = requests.Session()
    session.headers.update({
        "User-Agent": "SpotifySongless/2.0"
    })

    for q in candidate_queries:
        for attempt in range(2): # Retry on rate limit
            try:
                params = {"q": q, "limit": 5}
                resp = session.get(DEEZER_SEARCH_API, params=params, timeout=6)
                
                if resp.status_code != 200:
                    logger.warning(f"Deezer HTTP {resp.status_code} for query: {q}")
                    break

                data = resp.json()
                
                # Check for Deezer API rate limit / error response
                if "error" in data:
                    err = data["error"]
                    err_code = err.get("code")
                    if err_code == 4: # Quota limit exceeded
                        logger.warning(f"Deezer quota exceeded, backing off 250ms... (attempt {attempt + 1})")
                        time.sleep(0.25)
                        continue
                    else:
                        logger.warning(f"Deezer API error: {err}")
                        break

                items = data.get("data", [])
                if items:
                    for item in items:
                        preview_url = item.get("preview")
                        if preview_url:
                            logger.info(f"Found Deezer preview via query '{q}': {item.get('title')} by {item.get('artist', {}).get('name')}")
                            return {
                                "preview_url": preview_url,
                                "deezer_id": item.get("id"),
                                "title": item.get("title"),
                                "artist": item.get("artist", {}).get("name"),
                                "cover_medium": item.get("album", {}).get("cover_medium"),
                                "cover_big": item.get("album", {}).get("cover_big"),
                                "duration": item.get("duration", 30),
                                "query_used": q
                            }
                # No match with this query, continue to next fallback
                break

            except Exception as e:
                logger.warning(f"Exception querying Deezer with query '{q}': {e}")
                break

    logger.warning(f"No Deezer preview found for artist='{artist}', title='{title}'")
    return None
