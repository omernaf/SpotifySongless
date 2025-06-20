import React, { useState } from "react";
import axios from "axios";

function App() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [songs, setSongs] = useState([]);
  const [mp3Url, setMp3Url] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState("");

  const extractSongs = async () => {
    setLoading(true);
    setSongs([]);
    setMp3Url("");
    setCurrentSong("");
    try {
      const res = await axios.post("http://localhost:8000/extract_songs", { url: playlistUrl });
      setSongs(res.data.songs);
    } catch (e) {
      alert("Failed to extract songs. Check your playlist URL and backend.");
    }
    setLoading(false);
  };

  const downloadMp3 = async (query, display) => {
    setLoading(true);
    setCurrentSong(display);
    try {
      const res = await axios.post("http://localhost:8000/download_mp3", { query });
      setMp3Url("http://localhost:8000" + res.data.mp3_url);
    } catch (e) {
      alert("Failed to download MP3. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 600, margin: "auto" }}>
      <h2>Spotify Playlist Song Extractor</h2>
      <div style={{ marginBottom: 20 }}>
        <input
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          placeholder="Paste Spotify playlist link here..."
          style={{ width: 400, fontSize: 18, marginRight: 10 }}
          disabled={loading}
        />
        <button onClick={extractSongs} disabled={loading || !playlistUrl}>Extract Songs</button>
      </div>
      <div>
        {songs.map(song => (
          <div key={song.query} style={{ marginBottom: 8 }}>
            <button
              onClick={() => downloadMp3(song.query, song.display)}
              disabled={loading}
              style={{
                background: currentSong === song.display ? "#4caf50" : "#222",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: 4,
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {song.display}
            </button>
          </div>
        ))}
      </div>
      {mp3Url && (
        <div style={{ marginTop: 30 }}>
          <audio controls src={mp3Url} autoPlay style={{ width: "100%" }} />
          <div style={{ marginTop: 8, color: "#4caf50" }}>{currentSong}</div>
        </div>
      )}
      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}
    </div>
  );
}

export default App;