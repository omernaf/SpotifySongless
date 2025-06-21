import React from "react";

export default function LandingScreen({ playlistUrl, setPlaylistUrl, onStart, status }) {
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
        width: 400,
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
          Spotify Songless
        </h2>
        <input
          type="text"
          placeholder="Paste Spotify playlist link..."
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 10px",
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #444",
            marginBottom: 16
          }}
        />
        <button
          onClick={onStart}
          style={{
            width: "100%",
            background: "#2ecc71",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 18,
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            cursor: "pointer"
          }}
        >
          Start Game
        </button>
        {status && <div style={{ color: "#e74c3c", marginTop: 16 }}>{status}</div>}
      </div>
    </div>
  );
}