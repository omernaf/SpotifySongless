import time
import requests
import logging

logger = logging.getLogger("spotify_songless")

_FEATURED_CACHE = None
_CACHE_TIMESTAMP = 0
CACHE_DURATION_SECONDS = 3600  # 1 hour

FALLBACK_FEATURED = [
    {
        "id": "dz-3899810742",
        "name": "להיטים ישראליים",
        "subtitle": "Top Israeli & Hebrew Pop",
        "url": "https://www.deezer.com/playlist/3899810742",
        "platform": "Deezer",
        "badge": "🇮🇱 Hebrew",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/3899810742/250x250-000000-80-0-0.jpg"
    },
    {
        "id": "dz-13786357601",
        "name": "Israel Top 100",
        "subtitle": "Trending Hits in Israel",
        "url": "https://www.deezer.com/playlist/13786357601",
        "platform": "Deezer",
        "badge": "🇮🇱 Hebrew",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/13786357601/250x250-000000-80-0-0.jpg"
    },
    {
        "id": "dz-3155776842",
        "name": "Top Worldwide Hits",
        "subtitle": "Global Pop & Chart Toppers",
        "url": "https://www.deezer.com/playlist/3155776842",
        "platform": "Deezer",
        "badge": "🔥 Global",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/3155776842/250x250-000000-80-0-0.jpg"
    },
    {
        "id": "dz-1306931615",
        "name": "Rock Essentials",
        "subtitle": "Classic & Modern Rock Legends",
        "url": "https://www.deezer.com/playlist/1306931615",
        "platform": "Deezer",
        "badge": "🎸 Rock",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/1306931615/250x250-000000-80-0-0.jpg"
    },
    {
        "id": "dz-1977689462",
        "name": "2000s Party Hits",
        "subtitle": "Millennial Throwbacks",
        "url": "https://www.deezer.com/playlist/1977689462",
        "platform": "Deezer",
        "badge": "🎉 2000s",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/1977689462/250x250-000000-80-0-0.jpg"
    },
    {
        "id": "dz-4881438128",
        "name": "רוק ישראלי",
        "subtitle": "Israeli Rock Classics",
        "url": "https://www.deezer.com/playlist/4881438128",
        "platform": "Deezer",
        "badge": "🇮🇱 Hebrew",
        "thumbnail": "https://cdn-images.dzcdn.net/images/playlist/4881438128/250x250-000000-80-0-0.jpg"
    }
]

def get_featured_playlists():
    global _FEATURED_CACHE, _CACHE_TIMESTAMP
    now = time.time()
    if _FEATURED_CACHE and (now - _CACHE_TIMESTAMP < CACHE_DURATION_SECONDS):
        return _FEATURED_CACHE

    try:
        results = []
        session = requests.Session()
        session.headers.update({"User-Agent": "SpotifySongless/2.0"})

        # 1. Fetch live Israeli popular playlists
        try:
            r_il = session.get("https://api.deezer.com/search/playlist", params={"q": "להיטים ישראליים", "limit": 4}, timeout=5)
            if r_il.status_code == 200:
                for pl in r_il.json().get("data", []):
                    if pl.get("nb_tracks", 0) >= 15:
                        results.append({
                            "id": f"dz-{pl['id']}",
                            "name": pl.get("title", "ישראלי"),
                            "subtitle": f"{pl.get('nb_tracks')} Hebrew Tracks",
                            "url": pl.get("link", f"https://www.deezer.com/playlist/{pl['id']}"),
                            "platform": "Deezer",
                            "badge": "🇮🇱 Hebrew",
                            "thumbnail": pl.get("picture_medium") or pl.get("picture_big") or ""
                        })
        except Exception as e:
            logger.warning(f"Failed to fetch live Israeli playlists: {e}")

        # 2. Fetch live Global Chart playlists
        try:
            r_chart = session.get("https://api.deezer.com/chart/0/playlists", params={"limit": 3}, timeout=5)
            if r_chart.status_code == 200:
                for pl in r_chart.json().get("data", []):
                    if pl.get("nb_tracks", 0) >= 15:
                        results.append({
                            "id": f"dz-{pl['id']}",
                            "name": pl.get("title", "Top Hits"),
                            "subtitle": f"{pl.get('nb_tracks')} Global Tracks",
                            "url": pl.get("link", f"https://www.deezer.com/playlist/{pl['id']}"),
                            "platform": "Deezer",
                            "badge": "🔥 Global",
                            "thumbnail": pl.get("picture_medium") or pl.get("picture_big") or ""
                        })
        except Exception as e:
            logger.warning(f"Failed to fetch live chart playlists: {e}")

        # 3. Add Rock and 2000s essentials
        try:
            r_rock = session.get("https://api.deezer.com/search/playlist", params={"q": "Rock Essentials", "limit": 2}, timeout=5)
            if r_rock.status_code == 200:
                for pl in r_rock.json().get("data", []):
                    if pl.get("nb_tracks", 0) >= 15:
                        results.append({
                            "id": f"dz-{pl['id']}",
                            "name": pl.get("title", "Rock Essentials"),
                            "subtitle": f"{pl.get('nb_tracks')} Rock Tracks",
                            "url": pl.get("link", f"https://www.deezer.com/playlist/{pl['id']}"),
                            "platform": "Deezer",
                            "badge": "🎸 Rock",
                            "thumbnail": pl.get("picture_medium") or pl.get("picture_big") or ""
                        })
        except Exception as e:
            logger.warning(f"Failed to fetch live rock playlists: {e}")

        # Deduplicate by url/id
        seen = set()
        deduped = []
        for item in results:
            if item["url"] not in seen:
                seen.add(item["url"])
                deduped.append(item)

        if len(deduped) >= 4:
            _FEATURED_CACHE = deduped[:8]
            _CACHE_TIMESTAMP = now
            return _FEATURED_CACHE
    except Exception as e:
        logger.error(f"Error fetching live featured playlists: {e}")

    _FEATURED_CACHE = FALLBACK_FEATURED
    _CACHE_TIMESTAMP = now
    return _FEATURED_CACHE
