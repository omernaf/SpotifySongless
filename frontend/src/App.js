import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "http://10.100.102.72:8000";
const UNLOCK_STEPS = [0.1, 0.5, 2, 4, 8, 15, 30, Infinity];

function App() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [songs, setSongs] = useState([]);
  const [mp3Url, setMp3Url] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState("");
  const [status, setStatus] = useState("");
  const [unlockStep, setUnlockStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  }, [mp3Url]);

  const playRandomSong = async (songsList) => {
    if (!songsList || songsList.length === 0) return;
    setUnlockStep(0);
    setCurrentTime(0);
    setIsPlaying(false);
    const randomSong = songsList[Math.floor(Math.random() * songsList.length)];
    setCurrentSong(randomSong.display);
    setStatus(`Downloading: ${randomSong.display}`);
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/download_mp3`, { query: randomSong.query });
      setMp3Url(BACKEND_URL + res.data.mp3_url);
      setStatus(`Now playing: ${randomSong.display}`);
    } catch (e) {
      setStatus("Failed to download MP3. Try again.");
      setMp3Url("");
    }
    setLoading(false);
  };

  const extractSongs = async () => {
    setLoading(true);
    setSongs([]);
    setMp3Url("");
    setCurrentSong("");
    setStatus("");
    setUnlockStep(0);
    setCurrentTime(0);
    setIsPlaying(false);
    try {
      const res = await axios.post(`${BACKEND_URL}/extract_songs`, { url: playlistUrl });
      setSongs(res.data.songs);
      if (res.data.songs.length === 0) {
        setStatus("No songs found in this playlist.");
      } else {
        playRandomSong(res.data.songs);
      }
    } catch (e) {
      setStatus("Failed to extract songs. Check your playlist URL and backend.");
    }
    setLoading(false);
  };

  const playAnotherRandom = () => {
    playRandomSong(songs);
  };

  const getCurrentMax = () => UNLOCK_STEPS[unlockStep];

  // Pause at the current unlock step unless fully unlocked
  const handleTimeUpdate = () => {
    const maxTime = getCurrentMax();
    if (
      audioRef.current &&
      unlockStep < UNLOCK_STEPS.length - 1 &&
      audioRef.current.currentTime >= maxTime
    ) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    } else if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSkip = () => {
    setUnlockStep((prev) => Math.min(prev + 1, UNLOCK_STEPS.length - 1));
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }, 100);
  };

  const handleSeek = (e) => {
    const maxTime = getCurrentMax();
    if (audioRef.current && audioRef.current.currentTime > maxTime) {
      audioRef.current.currentTime = maxTime;
    }
    setCurrentTime(audioRef.current ? audioRef.current.currentTime : 0);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Optional: allow clicking the progress bar to seek (but not beyond unlock)
  const handleProgressBarClick = (e) => {
    if (!audioRef.current) return;
    const bar = e.target.getBoundingClientRect();
    const clickX = e.clientX - bar.left;
    let max = getCurrentMax();
    if (max === Infinity) {
      max = audioRef.current.duration;
    }
    if (!isFinite(max) || max === 0) return; // Prevent NaN/Infinity errors
    const percent = clickX / bar.width;
    const seekTime = Math.min(max, percent * max);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  function formatTime(secs) {
    if (!isFinite(secs)) return "...";
    const s = Math.round(secs);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  }

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
          Extract & Play Random Song
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
        {mp3Url && (
          <div style={{ width: "100%", marginTop: 10 }}>
            {/* Hidden audio element */}
            <audio
              ref={audioRef}
              src={mp3Url}
              autoPlay
              onTimeUpdate={handleTimeUpdate}
              onSeeked={handleSeek}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              style={{ display: "none" }}
            />
            {/* Custom controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handlePlayPause}
                style={{
                  background: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  fontSize: 22,
                  fontWeight: "bold",
                  cursor: "pointer"
                }}
              >
                {isPlaying ? "❚❚" : "►"}
              </button>
              {/* Progress bar */}
              <div style={{ flex: 1, cursor: "pointer" }} onClick={handleProgressBarClick}>
                <div style={{
                  background: "#444",
                  borderRadius: 4,
                  height: 8,
                  width: "100%",
                  position: "relative"
                }}>
                  <div style={{
                    background: "#2ecc71",
                    height: 8,
                    borderRadius: 4,
                    width: `${
                      getCurrentMax() === Infinity && audioRef.current && !isNaN(audioRef.current.duration)
                        ? Math.min((currentTime / audioRef.current.duration) * 100, 100)
                        : Math.min((currentTime / getCurrentMax()) * 100, 100)
                    }%`,
                    transition: "width 0.1s"
                  }} />
                </div>
                <div style={{ color: "#aaa", fontSize: 12, marginTop: 2 }}>
                  {formatTime(currentTime)} / {
                    getCurrentMax() === Infinity
                      ? (audioRef.current && !isNaN(audioRef.current.duration)
                          ? formatTime(audioRef.current.duration)
                          : "...")
                      : formatTime(getCurrentMax())
                  }
                </div>
              </div>
            </div>
            <div style={{
              marginTop: 8,
              color: "#2ecc71",
              fontWeight: "bold",
              textAlign: "center"
            }}>{currentSong}</div>
            {unlockStep < UNLOCK_STEPS.length - 1 && (
              <button
                onClick={handleSkip}
                style={{
                  marginTop: 16,
                  width: "100%",
                  background: "#e67e22",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 18,
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 0",
                  cursor: "pointer"
                }}
              >
                Skip ({UNLOCK_STEPS[unlockStep]}s → {UNLOCK_STEPS[unlockStep + 1] === Infinity ? "All" : UNLOCK_STEPS[unlockStep + 1] + "s"})
              </button>
            )}
            <button
              onClick={playAnotherRandom}
              disabled={loading || songs.length === 0}
              style={{
                marginTop: 16,
                width: "100%",
                background: "#2980b9",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 18,
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              Play Another Random Song
            </button>
          </div>
        )}
        {loading && <div style={{ marginTop: 18, color: "#fff" }}>Loading...</div>}
      </div>
    </div>
  );
}

export default App;