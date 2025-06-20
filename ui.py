from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.label import Label
from kivy.uix.scrollview import ScrollView
from kivy.uix.gridlayout import GridLayout
from kivy.graphics import Color, RoundedRectangle
from kivy.core.window import Window
from kivy.uix.progressbar import ProgressBar

def build_ui(HEBREW_FONT, extract_callback):
    Window.clearcolor = (0.13, 0.15, 0.18, 1)
    root = BoxLayout(orientation='vertical', padding=40, spacing=0)

    # Card-like container for content
    layout = BoxLayout(
        orientation='vertical',
        padding=30,
        spacing=20,
        size_hint=(0.95, 0.95),
        pos_hint={'center_x': 0.5, 'center_y': 0.5}
    )

    # Add background color to the card using canvas
    with layout.canvas.before:
        Color(0.18, 0.2, 0.23, 0.95)
        bg_rect = RoundedRectangle(
            pos=layout.pos,
            size=layout.size,
            radius=[20]
        )
    def update_bg(instance, value):
        bg_rect.pos = instance.pos
        bg_rect.size = instance.size
    layout.bind(pos=update_bg, size=update_bg)

    # Title
    title_label = Label(
        text='Spotify Playlist Song Extractor',
        font_size=32,
        size_hint_y=None,
        height=60,
        color=(0.2, 0.8, 0.4, 1),
        font_name=HEBREW_FONT,
        halign='center',
        valign='middle',
        bold=True,
        outline_color=(0, 0, 0, 0.4),
        outline_width=2
    )
    layout.add_widget(title_label)

    # Input
    input_box = TextInput(
        hint_text='Paste Spotify playlist link here...',
        size_hint_y=None,
        height=50,
        multiline=False,
        background_color=(0.15, 0.16, 0.18, 1),
        foreground_color=(1, 1, 1, 1),
        cursor_color=(0.2, 0.8, 0.4, 1),
        padding=(15, 15),
        font_name=HEBREW_FONT,
        halign='left',
        font_size=20,
        background_normal='',
        background_active=''
    )
    layout.add_widget(input_box)

    # Extract Button
    extract_button = Button(
        text='Extract Songs',
        size_hint_y=None,
        height=50,
        background_color=(0.2, 0.8, 0.4, 1),
        color=(1, 1, 1, 1),
        font_size=22,
        font_name=HEBREW_FONT,
        bold=True,
        background_normal='',
        background_down=''
    )
    extract_button.bind(on_press=extract_callback)
    layout.add_widget(extract_button)

    # Status Label
    status_label = TextInput(
        text='',
        size_hint_y=None,
        height=30,
        font_name=HEBREW_FONT,
        font_size=18,
        readonly=True,
        background_color=(0, 0, 0, 0),
        foreground_color=(1, 0.3, 0.3, 1),
        cursor_color=(0.2, 0.8, 0.4, 1),
        halign='left',
        multiline=False
    )
    layout.add_widget(status_label)

    # Output Area with styled ScrollView
    output_scroll = ScrollView(
        size_hint=(1, 1),
        bar_width=14,
        scroll_type=['bars', 'content'],
        do_scroll_y=True,
        effect_cls='ScrollEffect'
    )
    output_layout = GridLayout(
        cols=1,
        size_hint_y=None,
        spacing=10,
        padding=10
    )
    output_layout.bind(minimum_height=output_layout.setter('height'))
    output_scroll.add_widget(output_layout)
    layout.add_widget(output_scroll)

    # Progress Bar
    progress_bar = ProgressBar(max=100, value=0, size_hint_y=None, height=20)
    layout.add_widget(progress_bar)

    root.add_widget(layout)

    # Return all important widgets for use in main.py
    return root, input_box, status_label, output_layout, progress_bar