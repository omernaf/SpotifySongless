import React from "react";

export default function LandingScreen({ playlistUrl, setPlaylistUrl, onStart, status, playlistHistory }) {
  const supportedPlatforms = ["Spotify", "Apple Music", "YouTube Music", "Deezer"];
  const isButtonEnabled = playlistUrl && playlistUrl.trim().length > 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #121316 0%, #1c1e24 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 0"
    }}>
      <div style={{
        background: "rgba(26, 28, 34, 0.96)",
        borderRadius: 24,
        boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 94, 58, 0.15)",
        border: "1px solid rgba(255, 94, 58, 0.12)",
        padding: "36px 32px",
        width: 420,
        maxWidth: "92vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
      }}>
        {/* App Logo */}
        <img
          src="/logo192.png"
          alt="Songless Logo"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            marginBottom: 12,
            boxShadow: "0 6px 18px rgba(255, 94, 58, 0.35)"
          }}
        />
        <h2 style={{
          background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: "800",
          fontSize: 30,
          margin: "0 0 20px 0",
          textAlign: "center",
          letterSpacing: "-0.5px"
        }}>
          Spotify Songless
        </h2>
        <input
          type="text"
          placeholder="Paste playlist link..."
          value={playlistUrl}
          onChange={e => setPlaylistUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "13px 14px",
            fontSize: 16,
            borderRadius: 10,
            border: "1px solid #333742",
            background: "#181a1f",
            color: "#fff",
            marginBottom: 10,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease"
          }}
          onFocus={e => {
            e.target.style.borderColor = "#FF6B35";
            e.target.style.boxShadow = "0 0 0 3px rgba(255, 107, 53, 0.2)";
          }}
          onBlur={e => {
            e.target.style.borderColor = "#333742";
            e.target.style.boxShadow = "none";
          }}
        />

        {/* Supported Platforms Tags */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 16,
          width: "100%"
        }}>
          <span style={{ color: "#7a7f8d", fontSize: 12, fontWeight: "500" }}>Supported:</span>
          {supportedPlatforms.map((platform) => (
            <span
              key={platform}
              style={{
                background: "#181a1f",
                border: "1px solid rgba(255, 94, 58, 0.22)",
                color: "#c8ccd8",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: "500",
                letterSpacing: "0.2px"
              }}
            >
              {platform}
            </span>
          ))}
        </div>

        {playlistHistory.length > 0 && (
          <div style={{ marginBottom: 16, width: "100%" }}>
            <div style={{ color: "#8a8f9d", fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Playlists:</div>
            <div style={{ maxHeight: 150, overflowY: "auto" }} className="custom-scrollbar">
              {playlistHistory.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setPlaylistUrl(item.url)}
                  style={{
                    width: "100%",
                    marginBottom: 6,
                    background: "#1c1e24",
                    color: "#FFA07A",
                    border: "1px solid rgba(255, 107, 53, 0.25)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    boxSizing: "border-box"
                  }}
                >
                  <b style={{ color: "#fff" }}>{item.name}</b>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#8a8f9d", fontSize: 12 }}>
                    <span>{item.owner ? `by ${item.owner}` : ""}</span>
                    {typeof item.songCount === "number" && <span>{item.songCount} songs</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          disabled={!isButtonEnabled}
          style={{
            width: "100%",
            background: isButtonEnabled
              ? "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)"
              : "#21242b",
            color: isButtonEnabled ? "#ffffff" : "#5d6270",
            fontWeight: "700",
            fontSize: 17,
            border: isButtonEnabled ? "none" : "1px solid #2e323b",
            borderRadius: 10,
            padding: "13px 0",
            cursor: isButtonEnabled ? "pointer" : "not-allowed",
            boxShadow: isButtonEnabled ? "0 4px 18px rgba(255, 94, 58, 0.4)" : "none",
            boxSizing: "border-box",
            transition: "all 0.25s ease",
            opacity: isButtonEnabled ? 1 : 0.7
          }}
        >
          Start Game
        </button>

        {status && (
          <div style={{ color: "#ff6b6b", marginTop: 14, fontSize: 14, textAlign: "center" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}