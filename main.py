import kivy
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.label import Label
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.core.window import Window
from kivy.graphics import Color, RoundedRectangle
from kivy.core.audio import SoundLoader
import threading
from kivy.clock import Clock
import os
import time

from spotify_utils import sp, extract_playlist_id, is_hebrew, reverse_hebrew_words
from youtube_utils import open_top_youtube_result, MyLogger
from ui import build_ui

# Set the audio provider to ffpyplayer
os.environ['KIVY_AUDIO'] = 'ffpyplayer'

HEBREW_FONT = 'fonts/Rubik-VariableFont_wght.ttf'  # Make sure this path is correct

class SpotifyExtractorApp(App):
    def build(self):
        self.root_widget, self.input, self.status_label, self.output_layout, self.progress_bar = build_ui(
            HEBREW_FONT, self.extract_songs
        )
        return self.root_widget

    def play_mp3(self, mp3_path):
        if not mp3_path:
            self.status_label.text = "No MP3 path provided."
            return
        if not os.path.exists(mp3_path):
            self.status_label.text = f"File not found: {mp3_path}"
            return
        sound = SoundLoader.load(mp3_path)
        if sound:
            sound.play()
            self.status_label.text = f"Playing: {os.path.basename(mp3_path)}"
        else:
            self.status_label.text = f"Error: Could not play the file: {mp3_path}"

    def extract_songs(self, instance):
        self.output_layout.clear_widgets()
        self.status_label.text = ''
        playlist_url = self.input.text.strip()
        playlist_id = extract_playlist_id(playlist_url)
        if not playlist_id:
            self.status_label.text = 'Invalid Spotify playlist URL'
            return

        try:
            results = sp.playlist_items(playlist_id)
            if not results['items']:
                self.status_label.text = 'No songs found in this playlist.'
                return
            for item in results['items']:
                track = item['track']
                name = track['name']
                artists = ', '.join([artist['name'] for artist in track['artists']])
                display_text = f"{name} - {artists}"
                if is_hebrew(name) or is_hebrew(artists):
                    display_text = reverse_hebrew_words(display_text)
                query = f"{name} {artists}".replace('&', '')
                song_button = Button(
                    text=display_text,
                    size_hint_y=None,
                    height=38,
                    color=(1, 1, 1, 1),
                    font_name=HEBREW_FONT,
                    halign='left',
                    font_size=20,
                    padding=(10, 0),
                    background_normal='',
                    background_color=(0.15, 0.16, 0.18, 1)
                )
                def on_press_song(instance, q=query):
                    def download_and_play():
                        mp3_path = open_top_youtube_result(q, self.status_label, self.progress_bar)
                        if mp3_path:
                            for _ in range(50):
                                if os.path.exists(mp3_path):
                                    break
                                time.sleep(0.1)
                            print("MP3 PATH:", mp3_path)  # <-- Add this line
                            Clock.schedule_once(lambda dt: self.play_mp3(mp3_path))
                    threading.Thread(target=download_and_play, daemon=True).start()
                song_button.bind(on_press=on_press_song)
                self.output_layout.add_widget(song_button)
        except Exception as e:
            msg = str(e)
            if "ffprobe and ffmpeg not found" in msg and "Postprocessing" in msg:
                self.status_label.text = "Download complete! (ffmpeg warning)"
            else:
                self.status_label.text = f"Error: {msg}"

if __name__ == '__main__':
    SpotifyExtractorApp().run()
