import React, { useState, useRef } from "react";
import { reverseHebrewWords } from "./utils";

export default function GuessBar({ songs, onGuess, disabled }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    const isHebrew = (str) => /[\u0590-\u05FF]/.test(str);

    let compareValue = value;
    if (isHebrew(value)) {
      compareValue = reverseHebrewWords(value);
    }

    let filtered = [];
    if (value.length > 0) {
      filtered = songs.filter((s) =>
        s.display.toLowerCase().includes(compareValue.toLowerCase())
      );
      // Sort: exact match first, then startsWith, then others
      filtered.sort((a, b) => {
        const aDisp = a.display.toLowerCase();
        const bDisp = b.display.toLowerCase();
        if (aDisp === compareValue.toLowerCase()) return -1;
        if (bDisp === compareValue.toLowerCase()) return 1;
        if (aDisp.startsWith(compareValue.toLowerCase())) return -1;
        if (bDisp.startsWith(compareValue.toLowerCase())) return 1;
        return aDisp.localeCompare(bDisp);
      });
    } else {
      filtered = songs;
    }
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    if (input.length === 0) {
      setSuggestions(songs);
    }
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const handleSelect = (title) => {
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    onGuess(title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuess(input);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Prevent page scroll when scrolling inside the dropdown
  const handleTouchMove = (e) => {
    const el = dropdownRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (
      (scrollTop === 0 && e.touches[0].clientY > 0) ||
      (scrollTop + clientHeight === scrollHeight && e.touches[0].clientY < 0)
    ) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: 16, position: "relative" }}>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Guess the song..."
        disabled={disabled}
        style={{
          width: "100%",
          fontSize: 18,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#232526",
          color: "#fff",
          outline: "none",
        }}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            background: "#232526",
            border: "1px solid #444",
            borderRadius: 8,
            marginTop: 2,
            position: "absolute",
            zIndex: 10,
            width: "calc(100% - 2px)",
            maxHeight: 180,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
          onTouchMove={handleTouchMove}
        >
          {suggestions.map((song, idx) => (
            <div
              key={song.id || song.display + idx}
              onMouseDown={() => handleSelect(song.display)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <span dir="auto">{reverseHebrewWords(song.display)}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}