import React from "react";

export default function PlaylistInput({
  playlistUrl,
  setPlaylistUrl,
  extractSongs,
  loading
}) {
  return (
    <>
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
        Extract & Play Random Song
      </button>
    </>
  );
}