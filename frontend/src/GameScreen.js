import React from "react";
import Player from "./Player";
import GuessBar from "./GuessBar";
import { reverseHebrewWords } from "./utils";

export default function GameScreen(props) {
  const {
    mp3Url, audioRef, isPlaying, currentTime, getCurrentMax, formatTime,
    handlePlayPause, handleProgressBarClick, handleSkip, handleTimeUpdate, handleSeek,
    unlockStep, UNLOCK_STEPS, loading, playAnotherRandom, songs, guessBarKey,
    guessedCorrectly, guessFeedback, guessHistory, handleGuess, currentSong,
    setUnlockStep, setGuessedCorrectly, setGuessHistory,
  } = props;

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
        {/* Give Up Button */}
        {!guessedCorrectly && (
          <button
            onClick={() => {
              setUnlockStep(UNLOCK_STEPS.length - 1);
              setGuessedCorrectly(true);
              setGuessHistory(prev => [
                ...prev,
                { type: "giveup", value: "Gave up and revealed the song!" }
              ]);
            }}
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
              cursor: "pointer"
            }}
          >
            Give Up & Reveal Song
          </button>
        )}
        {/* ...rest of your game UI, feedback, history, etc... */}
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
            <span dir="auto" style={{ unicodeBidi: "isolate" }}>
              {reverseHebrewWords(currentSong)}
            </span>
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
                  Guess: <b><span dir="auto">{entry.value}</span></b> {entry.correct ? "✔️" : "❌"}
                </div>
              ) : (
                <div key={idx} style={{ color: "#f39c12" }}>
                  <span dir="auto">{reverseHebrewWords(entry.value)}</span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}