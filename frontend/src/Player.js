import React from "react";

export default function Player({
  audioRef,
  mp3Url,
  isPlaying,
  currentTime,
  getCurrentMax,
  formatTime,
  handlePlayPause,
  handleProgressBarClick,
  handleSkip,
  handleTimeUpdate,
  handleSeek,
  unlockStep,
  UNLOCK_STEPS,
  guessedCorrectly,
  loading,
  playAnotherRandom,
  songs
}) {
  return (
    <div style={{ width: "100%", marginTop: 10 }}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={mp3Url}
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onSeeked={handleSeek}
        onPlay={() => handlePlayPause(true)}
        onPause={() => handlePlayPause(false)}
        style={{ display: "none" }}
      />
      {/* Custom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => handlePlayPause(!isPlaying)}
          style={{
            background: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="3" y="3" width="4" height="14" rx="1.5" fill="white"/>
              <rect x="13" y="3" width="4" height="14" rx="1.5" fill="white"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20">
              <polygon points="5,3 17,10 5,17" fill="white"/>
            </svg>
          )}
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
                    : "0:30")
                : formatTime(getCurrentMax())
            }
          </div>
        </div>
      </div>
      {!guessedCorrectly && unlockStep < UNLOCK_STEPS.length - 1 && (
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
  );
}