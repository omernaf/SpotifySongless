import React from "react";
import Player from "./Player";
import GuessBar from "./GuessBar";
import { reverseHebrewWords } from "./utils";

export default function GameScreen(props) {
  const {
    mp3Url, audioRef, isPlaying, currentTime, getCurrentMax, formatTime,
    handlePlayPause, handleProgressBarClick, handleSkip, handleTimeUpdate, handleSeek,
    unlockStep, UNLOCK_STEPS, loading, playAnotherRandom, songs, guessBarKey,
    guessedCorrectly, guessFeedback, setGuessFeedback, guessHistory, handleGuess, currentSong, albumCover,
    setUnlockStep, setGuessedCorrectly, setGuessHistory,
    onReturnToLanding,
  } = props;

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
        width: 440,
        maxWidth: "92vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
      }}>
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
          guessedCorrectly={guessedCorrectly}
          loading={loading}
          playAnotherRandom={playAnotherRandom}
          songs={songs}
        />
        {!guessedCorrectly && (
          <GuessBar
            key={guessBarKey}
            songs={songs}
            onGuess={handleGuess}
            disabled={guessedCorrectly}
          />
        )}
        {/* Give Up Button */}
        {!guessedCorrectly && (
          <button
            onClick={() => {
              setUnlockStep(UNLOCK_STEPS.length - 1);
              setGuessedCorrectly(true);
              setGuessFeedback("");
              setGuessHistory(prev => [
                ...prev,
                { type: "giveup", value: "Gave up and revealed the song!" }
              ]);
              setTimeout(() => {
                if (audioRef.current) {
                  audioRef.current.play();
                  handlePlayPause(true);
                }
              }, 100);
            }}
            style={{
              marginTop: 12,
              width: "100%",
              background: "#24181a",
              color: "#ff7675",
              fontWeight: "600",
              fontSize: 15,
              border: "1px solid rgba(231, 76, 60, 0.35)",
              borderRadius: 10,
              padding: "10px 0",
              cursor: "pointer",
              boxSizing: "border-box"
            }}
          >
            Give Up & Reveal Song
          </button>
        )}
        {guessFeedback && (
          <div style={{
            color: guessedCorrectly ? "#FF9500" : "#ff6b6b",
            fontWeight: "700",
            fontSize: 16,
            marginTop: 12,
            textAlign: "center"
          }}>
            {guessFeedback}
          </div>
        )}
        {guessedCorrectly && (
          <div style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            width: "100%"
          }}>
            {albumCover && (
              <img
                src={albumCover}
                alt="Album Artwork"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 14,
                  boxShadow: "0 8px 24px rgba(255, 94, 58, 0.25), 0 4px 12px rgba(0,0,0,0.6)",
                  objectFit: "cover",
                  marginBottom: 12,
                  border: "1px solid rgba(255, 149, 0, 0.3)"
                }}
              />
            )}
            <div style={{
              background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "800",
              fontSize: 20,
              textAlign: "center",
              letterSpacing: "-0.3px",
              padding: "0 10px"
            }}>
              <span dir="auto" style={{ unicodeBidi: "isolate" }}>
                {reverseHebrewWords(currentSong)}
              </span>
            </div>
          </div>
        )}
        {guessHistory.length > 0 && (
          <div style={{
            marginTop: 16,
            width: "100%",
            background: "#181a1f",
            borderRadius: 10,
            border: "1px solid #282b35",
            padding: "12px 14px",
            color: "#e1e3e8",
            fontSize: 14,
            maxHeight: 120,
            overflowY: "auto",
            boxSizing: "border-box"
          }} className="custom-scrollbar">
            <div style={{ fontWeight: "700", color: "#8a8f9d", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Guess History:</div>
            {guessHistory.map((entry, idx) =>
              entry.type === "guess" ? (
                <div key={idx} style={{ color: entry.correct ? "#FF9500" : "#ff6b6b", marginBottom: 3 }}>
                  Guess: <b><span dir="auto">{reverseHebrewWords(entry.value)}</span></b> {entry.correct ? "✔️" : "❌"}
                </div>
              ) : (
                <div key={idx} style={{ color: "#FFA07A", marginBottom: 3 }}>
                  <span dir="auto">{reverseHebrewWords(entry.value)}</span>
                </div>
              )
            )}
          </div>
        )}
        <button
          onClick={onReturnToLanding}
          style={{
            marginTop: 16,
            width: "100%",
            background: "#22252e",
            color: "#8a8f9d",
            fontWeight: "600",
            fontSize: 14,
            border: "1px solid #2f333e",
            borderRadius: 10,
            padding: "10px 0",
            cursor: "pointer",
            boxSizing: "border-box"
          }}
        >
          Return to Home Page
        </button>
      </div>
    </div>
  );
}