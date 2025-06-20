import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Player from "./Player";
import { formatTime } from "./utils";
import PlaylistInput from "./PlaylistInput";
import StatusMessage from "./StatusMessage";
import GuessBar from "./GuessBar";

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
  const [guessFeedback, setGuessFeedback] = useState("");
  const [guessedCorrectly, setGuessedCorrectly] = useState(false);
  const [guessHistory, setGuessHistory] = useState([]);
  const [guessBarKey, setGuessBarKey] = useState(0);
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
    setStatus("Downloading..."); // No song name here
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/download_mp3`, { query: randomSong.query });
      setMp3Url(BACKEND_URL + res.data.mp3_url);
      setStatus(""); // No song name here either
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
    setGuessHistory([]);         // Clear guess history
    setGuessFeedback("");        // Clear feedback
    setGuessedCorrectly(false);  // Reset correct state
    setGuessBarKey(prev => prev + 1); // Force GuessBar to reset input
    playRandomSong(songs);
  };

  const getCurrentMax = () => UNLOCK_STEPS[unlockStep];

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
    setGuessHistory(prev => [...prev, { type: "skip", value: `Skip to ${UNLOCK_STEPS[unlockStep + 1] === Infinity ? "All" : UNLOCK_STEPS[unlockStep + 1] + "s"}` }]);
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

  // Play/pause handler for Player
  const handlePlayPause = (play) => {
    if (!audioRef.current) return;
    if (play === true) {
      audioRef.current.play();
      setIsPlaying(true);
    } else if (play === false) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleProgressBarClick = (e) => {
    if (!audioRef.current) return;
    const bar = e.target.getBoundingClientRect();
    const clickX = e.clientX - bar.left;
    let max = getCurrentMax();
    if (max === Infinity) {
      max = audioRef.current.duration;
    }
    if (!isFinite(max) || max === 0) return;
    const percent = clickX / bar.width;
    const seekTime = Math.min(max, percent * max);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleGuess = (guess) => {
    if (!currentSong) return;
    if (guess.trim().toLowerCase() === currentSong.trim().toLowerCase()) {
      setGuessFeedback("🎉 Correct!");
      setGuessedCorrectly(true);
      setGuessHistory(prev => [...prev, { type: "guess", value: guess, correct: true }]);
    } else {
      setGuessFeedback("❌ Try again!");
      setGuessedCorrectly(false);
      setGuessHistory(prev => [...prev, { type: "guess", value: guess, correct: false }]);
      // Auto skip to next length if possible
      if (unlockStep < UNLOCK_STEPS.length - 1) {
        handleSkip();
      }
    }
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
        <PlaylistInput
          playlistUrl={playlistUrl}
          setPlaylistUrl={setPlaylistUrl}
          extractSongs={extractSongs}
          loading={loading}
        />
        <StatusMessage status={status} />
        {mp3Url && (
          <>
            <Player
              audioRef={audioRef}
              mp3Url={mp3Url}
              isPlaying={isPlaying}
              currentTime={currentTime}
              getCurrentMax={getCurrentMax}
              formatTime={formatTime}
              handlePlayPause={handlePlayPause}
              handleProgressBarClick={handleProgressBarClick}
              handleSkip={handleSkip}
              handleTimeUpdate={handleTimeUpdate}
              handleSeek={handleSeek}
              unlockStep={unlockStep}
              UNLOCK_STEPS={UNLOCK_STEPS}
              loading={loading}
              playAnotherRandom={playAnotherRandom}
              songs={songs}
            />
            <GuessBar
              key={guessBarKey}
              songs={songs}
              onGuess={handleGuess}
              disabled={guessedCorrectly}
            />
            <button
              onClick={() => {
                setUnlockStep(UNLOCK_STEPS.length - 1); // Unlock full song
                setGuessedCorrectly(true); // Reveal the song name
                setGuessHistory(prev => [...prev, { type: "giveup", value: "Gave up and revealed the song!" }]);
              }}
              disabled={guessedCorrectly}
              style={{
                marginTop: 12,
                width: "100%",
                background: "#e74c3c",
                color: "#fff",
                fontWeight: "bold",
                fontSize: 16,
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                cursor: guessedCorrectly ? "not-allowed" : "pointer"
              }}
            >
              Give Up & Reveal Song
            </button>
            {guessFeedback && (
              <div style={{
                color: guessedCorrectly ? "#2ecc71" : "#e74c3c",
                fontWeight: "bold",
                marginTop: 8,
                textAlign: "center"
              }}>
                {guessFeedback}
              </div>
            )}
            {guessedCorrectly && (
              <div style={{
                color: "#2ecc71",
                fontWeight: "bold",
                marginTop: 8,
                textAlign: "center"
              }}>
                {currentSong}
              </div>
            )}
            {guessHistory.length > 0 && (
              <div style={{
                marginTop: 16,
                width: "100%",
                background: "#232526",
                borderRadius: 8,
                padding: 12,
                color: "#fff",
                fontSize: 15,
                maxHeight: 120,
                overflowY: "auto"
              }}>
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>History:</div>
                {guessHistory.map((entry, idx) =>
                  entry.type === "guess" ? (
                    <div key={idx} style={{ color: entry.correct ? "#2ecc71" : "#e74c3c" }}>
                      Guess: <b>{entry.value}</b> {entry.correct ? "✔️" : "❌"}
                    </div>
                  ) : (
                    <div key={idx} style={{ color: "#f39c12" }}>
                      {entry.value}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
        {loading && <div style={{ marginTop: 18, color: "#fff" }}>Loading...</div>}
      </div>
    </div>
  );
}

export default App;