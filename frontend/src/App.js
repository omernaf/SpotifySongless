import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { formatTime } from "./utils";
import LandingScreen from "./LandingScreen";
import LoadingScreen from "./LoadingScreen";
import GameScreen from "./GameScreen";
import Cookies from "js-cookie";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
console.log(`[SpotifySongless] Frontend configured to use backend at: ${BACKEND_URL}`);

// Previews from Deezer are 30s highlights, so 15s -> Infinity (full preview)
const UNLOCK_STEPS = [0.5, 1, 2, 4, 8, 15, Infinity];

// Save playlist metadata to cookie
function savePlaylistToCookie(playlistMeta) {
  if (!playlistMeta || !playlistMeta.url) return;
  let history = [];
  try {
    history = JSON.parse(Cookies.get("playlistHistory") || "[]");
  } catch { }
  history = history.filter(item => item.url !== playlistMeta.url);
  history.unshift(playlistMeta);
  if (history.length > 3) history = history.slice(0, 3);
  Cookies.set("playlistHistory", JSON.stringify(history), { expires: 365 });
  console.log(`[SpotifySongless] Saved playlist to cookie:`, playlistMeta);
}

// Read playlist history from cookie
function getPlaylistHistoryFromCookie() {
  try {
    const history = JSON.parse(Cookies.get("playlistHistory") || "[]");
    console.log(`[SpotifySongless] Loaded playlist history from cookie:`, history);
    return history;
  } catch {
    console.warn(`[SpotifySongless] Failed to parse playlist history from cookie`);
    return [];
  }
}

function App() {
  const [page, setPage] = useState("landing");
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
  const [playlistHistory, setPlaylistHistory] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    setPlaylistHistory(getPlaylistHistoryFromCookie());
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
    setIsPlaying(false);
  }, [mp3Url]);

  const playRandomSong = async (songsList) => {
    if (!songsList || songsList.length === 0) return;
    setUnlockStep(0);
    setCurrentTime(0);
    setIsPlaying(false);
    const randomSong = songsList[Math.floor(Math.random() * songsList.length)];
    setCurrentSong(randomSong.display);
    setStatus("Loading preview...");
    setLoading(true);
    try {
      console.log(`[SpotifySongless] Requesting preview for: ${randomSong.display}`);
      const res = await axios.post(`${BACKEND_URL}/get_preview`, {
        query: randomSong.query,
        title: randomSong.title,
        artist: randomSong.artist
      });
      const previewUrl = res.data.preview_url || res.data.mp3_url;
      const audioUrl = previewUrl.startsWith("http") ? previewUrl : `${BACKEND_URL}${previewUrl}`;
      setMp3Url(audioUrl);
      console.log(`[SpotifySongless] Preview loaded successfully. URL: ${audioUrl}`);
      setStatus("");
      setPage("game");
    } catch (e) {
      console.error(`[SpotifySongless] Failed to get preview for: ${randomSong.display}`, e);
      if (e.response && e.response.data) {
        console.error("[SpotifySongless] Backend Error Details:", e.response.data);
      }
      setStatus("Preview not available for this song. Please try another.");
      setMp3Url("");
      setPage("landing");
    }
    setLoading(false);
  };

  const handleStart = async () => {
    setPage("loading");
    setStatus("");
    setLoading(true);
    setSongs([]);
    setMp3Url("");
    setCurrentSong("");
    setUnlockStep(0);
    setCurrentTime(0);
    setIsPlaying(false);
    try {
      console.log(`[SpotifySongless] Requesting playlist extraction for URL: ${playlistUrl}`);
      const res = await axios.post(`${BACKEND_URL}/extract_songs`, { url: playlistUrl });
      setSongs(res.data.songs);
      console.log(`[SpotifySongless] Received ${res.data.songs.length} songs from backend`);
      if (res.data.songs.length === 0) {
        setStatus("No songs found in this playlist.");
        setPage("landing");
      } else {
        const playlistMeta = {
          url: playlistUrl,
          name: res.data.name || "Unknown Playlist",
          owner: res.data.owner || "",
          songCount: res.data.songs.length,
        };
        savePlaylistToCookie(playlistMeta);
        setPlaylistHistory(getPlaylistHistoryFromCookie());
        playRandomSong(res.data.songs);
      }
    } catch (e) {
      let errorMsg = "Failed to extract songs. ";
      if (e.response && e.response.data && e.response.data.detail) {
        errorMsg += `Reason: ${e.response.data.detail}`;
      } else if (e.response && e.response.data) {
        errorMsg += `Reason: ${JSON.stringify(e.response.data)}`;
      } else if (e.message) {
        errorMsg += `Error: ${e.message}`;
      } else {
        errorMsg += "Unknown error.";
      }
      console.error(`[SpotifySongless] Playlist extraction failed: ${errorMsg}`, e);
      setStatus(errorMsg);
      setPage("landing");
    }
    setLoading(false);
  };

  const playAnotherRandom = () => {
    setPage("loading");
    setGuessHistory([]);
    setGuessFeedback("");
    setGuessedCorrectly(false);
    setGuessBarKey(prev => prev + 1);
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

  const handleSeek = () => {
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

  const handleReturnToLanding = () => {
    setPage("landing");
  };

  if (page === "loading") return <LoadingScreen />;
  if (page === "game") return (
    <GameScreen
      mp3Url={mp3Url}
      audioRef={audioRef}
      isPlaying={isPlaying}
      currentTime={currentTime}
      getCurrentMax={() => UNLOCK_STEPS[unlockStep]}
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
      guessBarKey={guessBarKey}
      guessedCorrectly={guessedCorrectly}
      guessFeedback={guessFeedback}
      guessHistory={guessHistory}
      handleGuess={handleGuess}
      currentSong={currentSong}
      setUnlockStep={setUnlockStep}
      setGuessedCorrectly={setGuessedCorrectly}
      setGuessHistory={setGuessHistory}
      onReturnToLanding={handleReturnToLanding}
    />
  );
  return (
    <LandingScreen
      playlistUrl={playlistUrl}
      setPlaylistUrl={setPlaylistUrl}
      onStart={handleStart}
      status={status}
      playlistHistory={playlistHistory}
    />
  );
}

export default App;