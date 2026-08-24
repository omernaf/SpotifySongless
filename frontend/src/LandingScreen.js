import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

const FALLBACK_FEATURED = [
  {
    id: "dz-3899810742",
    name: "להיטים ישראליים",
    subtitle: "Top Israeli & Hebrew Pop",
    url: "https://www.deezer.com/playlist/3899810742",
    platform: "Deezer",
    badge: "🇮🇱 Hebrew",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/3899810742/250x250-000000-80-0-0.jpg"
  },
  {
    id: "dz-13786357601",
    name: "Israel Top 100",
    subtitle: "Trending Hits in Israel",
    url: "https://www.deezer.com/playlist/13786357601",
    platform: "Deezer",
    badge: "🇮🇱 Hebrew",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/13786357601/250x250-000000-80-0-0.jpg"
  },
  {
    id: "dz-3155776842",
    name: "Top Worldwide Hits",
    subtitle: "Global Pop & Chart Toppers",
    url: "https://www.deezer.com/playlist/3155776842",
    platform: "Deezer",
    badge: "🔥 Global",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/3155776842/250x250-000000-80-0-0.jpg"
  },
  {
    id: "dz-1306931615",
    name: "Rock Essentials",
    subtitle: "Classic & Modern Rock",
    url: "https://www.deezer.com/playlist/1306931615",
    platform: "Deezer",
    badge: "🎸 Rock",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/1306931615/250x250-000000-80-0-0.jpg"
  },
  {
    id: "dz-1977689462",
    name: "2000s Party Hits",
    subtitle: "Millennial Throwbacks",
    url: "https://www.deezer.com/playlist/1977689462",
    platform: "Deezer",
    badge: "🎉 2000s",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/1977689462/250x250-000000-80-0-0.jpg"
  },
  {
    id: "dz-4881438128",
    name: "רוק ישראלי",
    subtitle: "Israeli Rock Classics",
    url: "https://www.deezer.com/playlist/4881438128",
    platform: "Deezer",
    badge: "🇮🇱 Hebrew",
    thumbnail: "https://cdn-images.dzcdn.net/images/playlist/4881438128/250x250-000000-80-0-0.jpg"
  }
];

export default function LandingScreen({ playlistUrl, setPlaylistUrl, onStart, status, playlistHistory }) {
  const supportedPlatforms = ["Spotify", "Apple Music", "YouTube Music", "Deezer"];
  const isButtonEnabled = playlistUrl && playlistUrl.trim().length > 0;
  const [activeFilter, setActiveFilter] = useState("All");
  const [featuredPlaylists, setFeaturedPlaylists] = useState(FALLBACK_FEATURED);

  useEffect(() => {
    // Dynamically fetch fresh popular playlists from backend
    axios.get(`${BACKEND_URL}/featured_playlists`)
      .then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setFeaturedPlaylists(res.data);
        }
      })
      .catch(err => {
        console.warn("Could not fetch dynamic featured playlists, using fallback defaults", err);
      });
  }, []);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const cleanText = text.trim();
          setPlaylistUrl(cleanText);
          onStart(cleanText);
        }
      }
    } catch (err) {
      console.warn("Clipboard access denied or unavailable", err);
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (playlistUrl && playlistUrl.trim()) {
      onStart(playlistUrl.trim());
    }
  };

  const filteredFeatured = activeFilter === "All"
    ? featuredPlaylists
    : activeFilter === "Hebrew"
      ? featuredPlaylists.filter(p => p.badge && p.badge.includes("Hebrew"))
      : featuredPlaylists.filter(p => !p.badge || !p.badge.includes("Hebrew"));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #121316 0%, #1c1e24 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 0"
    }}>
      <div style={{
        background: "rgba(26, 28, 34, 0.96)",
        borderRadius: 24,
        boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 94, 58, 0.15)",
        border: "1px solid rgba(255, 94, 58, 0.12)",
        padding: "32px 28px",
        width: 440,
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
            width: 54,
            height: 54,
            borderRadius: 14,
            marginBottom: 10,
            boxShadow: "0 6px 18px rgba(255, 94, 58, 0.35)"
          }}
        />
        <h2 style={{
          background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: "800",
          fontSize: 28,
          margin: "0 0 18px 0",
          textAlign: "center",
          letterSpacing: "-0.5px"
        }}>
          Spotify Songless
        </h2>

        {/* Input & Form Container for Enter / Go key support */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Input & Paste Button Row */}
          <div style={{
            display: "flex",
            width: "100%",
            gap: 8,
            marginBottom: 8,
            boxSizing: "border-box"
          }}>
            <input
              type="url"
              enterKeyHint="go"
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="Paste playlist or album link..."
              value={playlistUrl}
              onChange={e => setPlaylistUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 14px",
                fontSize: 15,
                borderRadius: 10,
                border: "1px solid #333742",
                background: "#181a1f",
                color: "#fff",
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
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              title="Paste from clipboard and start"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#22252e",
                color: "#FF9500",
                border: "1px solid rgba(255, 149, 0, 0.35)",
                borderRadius: 10,
                padding: "0 14px",
                fontSize: 14,
                fontWeight: "600",
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s ease",
                boxSizing: "border-box"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 107, 53, 0.15)";
                e.currentTarget.style.borderColor = "#FF6B35";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#22252e";
                e.currentTarget.style.borderColor = "rgba(255, 149, 0, 0.35)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Paste</span>
            </button>
          </div>

          {/* Supported Platforms Tags */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            flexWrap: "wrap",
            marginBottom: 14,
            width: "100%"
          }}>
            <span style={{ color: "#7a7f8d", fontSize: 11, fontWeight: "500" }}>Supported:</span>
            {supportedPlatforms.map((platform) => (
              <span
                key={platform}
                style={{
                  background: "#181a1f",
                  border: "1px solid rgba(255, 94, 58, 0.22)",
                  color: "#c8ccd8",
                  borderRadius: 6,
                  padding: "2px 7px",
                  fontSize: 11,
                  fontWeight: "500",
                  letterSpacing: "0.2px"
                }}
              >
                {platform}
              </span>
            ))}
          </div>

          <button
            type="submit"
            disabled={!isButtonEnabled}
            style={{
              width: "100%",
              background: isButtonEnabled
                ? "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)"
                : "#21242b",
              color: isButtonEnabled ? "#ffffff" : "#5d6270",
              fontWeight: "700",
              fontSize: 16,
              border: isButtonEnabled ? "none" : "1px solid #2e323b",
              borderRadius: 10,
              padding: "12px 0",
              cursor: isButtonEnabled ? "pointer" : "not-allowed",
              boxShadow: isButtonEnabled ? "0 4px 18px rgba(255, 94, 58, 0.4)" : "none",
              boxSizing: "border-box",
              transition: "all 0.25s ease",
              opacity: isButtonEnabled ? 1 : 0.7,
              marginBottom: 16
            }}
          >
            Start Game
          </button>
        </form>

        {/* 1. Recent Playlists Section (Shown FIRST above Quick Play if history exists) */}
        {playlistHistory.length > 0 && (
          <div style={{ width: "100%", marginBottom: 16 }}>
            <div style={{ color: "#8a8f9d", fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Recent Playlists:
            </div>
            <div style={{ maxHeight: "min(140px, 20vh)", overflowY: "auto", overscrollBehavior: "contain" }} className="custom-scrollbar">
              {playlistHistory.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPlaylistUrl(item.url);
                    onStart(item.url);
                  }}
                  style={{
                    width: "100%",
                    marginBottom: 6,
                    background: "#1c1e24",
                    color: "#FFA07A",
                    border: "1px solid rgba(255, 107, 53, 0.22)",
                    borderRadius: 10,
                    padding: "7px 9px",
                    cursor: "pointer",
                    fontSize: 13,
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxSizing: "border-box",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(255, 94, 58, 0.5)";
                    e.currentTarget.style.background = "#242730";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255, 107, 53, 0.22)";
                    e.currentTarget.style.background = "#1c1e24";
                  }}
                >
                  {item.thumbnail ? (
                    <>
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = "flex";
                          }
                        }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid rgba(255, 94, 58, 0.2)"
                        }}
                      />
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
                        display: "none",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: 15,
                        flexShrink: 0
                      }}>
                        🎵
                      </div>
                    </>
                  ) : (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 15,
                      flexShrink: 0
                    }}>
                      🎵
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    <b style={{ color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</b>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#8a8f9d", fontSize: 11 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.owner ? `by ${item.owner}` : ""}</span>
                      {typeof item.songCount === "number" && <span style={{ flexShrink: 0 }}>{item.songCount} songs</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. Quick Play / Popular Playlists Section */}
        <div style={{ width: "100%", marginBottom: 8 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8
          }}>
            <div style={{ color: "#8a8f9d", fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Play:
            </div>
            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "All", label: "All" },
                { id: "Hebrew", label: "🇮🇱 ישראלי" },
                { id: "Global", label: "🌍 Global" }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    background: activeFilter === tab.id ? "rgba(255, 94, 58, 0.2)" : "#181a1f",
                    border: `1px solid ${activeFilter === tab.id ? "rgba(255, 94, 58, 0.5)" : "#2e323b"}`,
                    color: activeFilter === tab.id ? "#FF9500" : "#7a7f8d",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Playlists List */}
          <div style={{
            maxHeight: "min(200px, 28vh)",
            overflowY: "auto",
            overscrollBehavior: "contain",
            display: "flex",
            flexDirection: "column",
            gap: 6
          }} className="custom-scrollbar">
            {filteredFeatured.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => {
                  setPlaylistUrl(item.url);
                  onStart(item.url);
                }}
                style={{
                  width: "100%",
                  background: "#1c1e24",
                  border: "1px solid rgba(255, 94, 58, 0.2)",
                  borderRadius: 10,
                  padding: "7px 9px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxSizing: "border-box",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(255, 94, 58, 0.5)";
                  e.currentTarget.style.background = "#242730";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(255, 94, 58, 0.2)";
                  e.currentTarget.style.background = "#1c1e24";
                }}
              >
                {item.thumbnail ? (
                  <>
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = "flex";
                        }
                      }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        objectFit: "cover",
                        flexShrink: 0,
                        border: "1px solid rgba(255, 94, 58, 0.25)"
                      }}
                    />
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
                      display: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 16,
                      flexShrink: 0
                    }}>
                      🎵
                    </div>
                  </>
                ) : (
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 16,
                    flexShrink: 0
                  }}>
                    🎵
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <b style={{ color: "#ffffff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </b>
                    <span style={{
                      background: "rgba(255, 94, 58, 0.15)",
                      color: "#FFA07A",
                      borderRadius: 4,
                      padding: "1px 5px",
                      fontSize: 10,
                      fontWeight: "600",
                      flexShrink: 0
                    }}>
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#8a8f9d", fontSize: 11 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.subtitle}
                    </span>
                    <span style={{ color: "#6e7382", flexShrink: 0 }}>
                      {item.platform}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {status && (
          <div style={{ color: "#ff6b6b", marginTop: 14, fontSize: 14, textAlign: "center" }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}