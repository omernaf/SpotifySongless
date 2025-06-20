import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import re

CLIENT_ID = 'c8a7cac32dfe409fbc685d036abc4c6a'
CLIENT_SECRET = '8b7e92c4bc0e47f99b119fd20c36a869'

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

def extract_playlist_id(url):
    match = re.search(r'playlist/([a-zA-Z0-9]+)', url)
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