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
    <div style={{ width: "100%", marginTop: 4 }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={() => handlePlayPause(!isPlaying)}
          style={{
            background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            boxShadow: "0 4px 14px rgba(255, 94, 58, 0.4)",
            flexShrink: 0
          }}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="4" y="3" width="3.5" height="14" rx="1.5" fill="white"/>
              <rect x="12.5" y="3" width="3.5" height="14" rx="1.5" fill="white"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ marginLeft: 2 }}>
              <polygon points="5,3 17,10 5,17" fill="white"/>
            </svg>
          )}
        </button>
        {/* Progress bar */}
        <div style={{ flex: 1, cursor: "pointer" }} onClick={handleProgressBarClick}>
          <div style={{
            background: "#252830",
            borderRadius: 6,
            height: 8,
            width: "100%",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(90deg, #FF5E3A 0%, #FF9500 100%)",
              height: 8,
              borderRadius: 6,
              width: `${
                getCurrentMax() === Infinity && audioRef.current && !isNaN(audioRef.current.duration)
                  ? Math.min((currentTime / audioRef.current.duration) * 100, 100)
                  : Math.min((currentTime / getCurrentMax()) * 100, 100)
              }%`,
              transition: "width 0.1s linear"
            }} />
          </div>
          <div style={{
            color: "#8a8f9d",
            fontSize: 12,
            marginTop: 4,
            fontWeight: "500",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>
              {getCurrentMax() === Infinity
                ? (audioRef.current && !isNaN(audioRef.current.duration)
                    ? formatTime(audioRef.current.duration)
                    : "0:30")
                : formatTime(getCurrentMax())}
            </span>
          </div>
        </div>
      </div>
      {!guessedCorrectly && unlockStep < UNLOCK_STEPS.length - 1 && (
        <button
          onClick={handleSkip}
          style={{
            marginTop: 14,
            width: "100%",
            background: "#22252e",
            color: "#FF9500",
            fontWeight: "700",
            fontSize: 16,
            border: "1px solid rgba(255, 149, 0, 0.4)",
            borderRadius: 10,
            padding: "11px 0",
            cursor: "pointer",
            boxSizing: "border-box"
          }}
        >
          Skip ({UNLOCK_STEPS[unlockStep]}s → {UNLOCK_STEPS[unlockStep + 1] === Infinity ? "All" : UNLOCK_STEPS[unlockStep + 1] + "s"})
        </button>
      )}
      <button
        onClick={playAnotherRandom}
        disabled={loading || songs.length === 0}
        style={{
          marginTop: 14,
          width: "100%",
          background: "linear-gradient(135deg, #FF5E3A 0%, #FF9500 100%)",
          color: "#fff",
          fontWeight: "700",
          fontSize: 16,
          border: "none",
          borderRadius: 10,
          padding: "11px 0",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 4px 14px rgba(255, 94, 58, 0.35)",
          boxSizing: "border-box"
        }}
      >
        Play Another Random Song
      </button>
    </div>
  );
}