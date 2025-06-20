import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = "http://10.100.102.72:8000";

function App() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [songs, setSongs] = useState([]);
  const [mp3Url, setMp3Url] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [status, setStatus] = useState("");

  const extractSongs = async () => {
    setLoading(true);
    setSongs([]);
    setMp3Url("");
    setCurrentSong("");
    setStatus("");
    try {
      const res = await axios.post(`${BACKEND_URL}/extract_songs`, { url: playlistUrl });
      setSongs(res.data.songs);
      if (res.data.songs.length === 0) setStatus("No songs found in this playlist.");
    } catch (e) {
      setStatus("Failed to extract songs. Check your playlist URL and backend.");
    }
    setLoading(false);
  };

  const downloadMp3 = async (query, display) => {
    setLoading(true);
    setCurrentSong(display);
    setStatus("");
    try {
      const res = await axios.post(`${BACKEND_URL}/download_mp3`, { query });
      setMp3Url(BACKEND_URL + res.data.mp3_url);
      setStatus("Download complete!");
    } catch (e) {
      setStatus("Failed to download MP3. Try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "rgba(30,32,36,0.97)",
        borderRadius: 20,
        boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)",
        padding: 40,
        width: 480,
        maxWidth: "95vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <h2 style={{
          color: "#2ecc71",
          fontWeight: "bold",
          fontSize: 32,
          marginBottom: 24,
          textShadow: "1px 1px 4px #000"
        }}>
          Spotify Playlist Song Extractor
        </h2>
        <input
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          placeholder="Paste Spotify playlist link here..."
          style={{
            width: "100%",
            fontSize: 18,
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            marginBottom: 16,
            background: "#232526",
            color: "#fff",
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
          disabled={loading}
        />
        <button
          onClick={extractSongs}
          disabled={loading || !playlistUrl}
          style={{
            width: "100%",
            background: "#27ae60",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 20,
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            marginBottom: 18,
            cursor: loading || !playlistUrl ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}
        >
          Extract Songs
        </button>
        {status && (
          <div style={{
            color: status.startsWith("Failed") ? "#e74c3c" : "#2ecc71",
            marginBottom: 10,
            fontWeight: "bold",
            width: "100%",
            textAlign: "center"
          }}>
            {status}
          </div>
        )}
        <div style={{
          width: "100%",
          maxHeight: 260,
          overflowY: "auto",
          marginBottom: 18,
          background: "rgba(44, 62, 80, 0.3)",
          borderRadius: 10,
          padding: 8
        }}>
          {songs.map(song => (
            <button
              key={song.query}
              onClick={() => downloadMp3(song.query, song.display)}
              disabled={loading}
              style={{
                width: "100%",
                textAlign: "left",
                background: currentSong === song.display ? "#27ae60" : "#232526",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 14px",
                marginBottom: 8,
                fontSize: 18,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              {song.display}
            </button>
          ))}
        </div>
        {mp3Url && (
          <div style={{ width: "100%", marginTop: 10 }}>
            <audio controls src={mp3Url} autoPlay style={{ width: "100%" }} />
            <div style={{
              marginTop: 8,
              color: "#2ecc71",
              fontWeight: "bold",
              textAlign: "center"
            }}>{currentSong}</div>
          </div>
        )}
        {loading && <div style={{ marginTop: 18, color: "#fff" }}>Loading...</div>}
      </div>
    </div>
  );
}

export default App;