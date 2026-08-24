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
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center"
          }}>
            {albumCover && (
              <img
                src={albumCover}
                alt="Album Artwork"
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  objectFit: "cover",
                  marginBottom: 10,
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              />
            )}
            <div style={{
              color: "#2ecc71",
              fontWeight: "bold",
              fontSize: 18,
              textAlign: "center"
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
                  Guess: <b><span dir="auto">{reverseHebrewWords(entry.value)}</span></b> {entry.correct ? "✔️" : "❌"}
                </div>
              ) : (
                <div key={idx} style={{ color: "#f39c12" }}>
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
            background: "#444",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 16,
            border: "none",
            borderRadius: 8,
            padding: "10px 0",
            cursor: "pointer"
          }}
        >
          Return to Home Page
        </button>
      </div>
    </div>
  );
}