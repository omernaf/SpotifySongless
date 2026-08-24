import React, { useState, useRef } from "react";
import { reverseHebrewWords } from "./utils";

export default function GuessBar({ songs, onGuess, disabled }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const lastY = useRef(null);

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
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSelect = (title) => {
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    onGuess(title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onGuess(input);
      setInput("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Trap scroll inside dropdown on mobile
  const handleTouchStart = (e) => {
    lastY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const el = dropdownRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const currentY = e.touches[0].clientY;
    const isScrollingUp = currentY > lastY.current;
    const isScrollingDown = currentY < lastY.current;

    const atTop = scrollTop === 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight;

    if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
      // Only prevent default if at edge
      e.preventDefault();
    }

    lastY.current = currentY;
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
          boxSizing: "border-box"
        }}
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="custom-scrollbar"
          style={{
            background: "#232526",
            border: "1px solid #444",
            borderRadius: 8,
            marginTop: 4,
            position: "absolute",
            zIndex: 100,
            width: "100%",
            boxSizing: "border-box",
            maxHeight: "min(240px, 35vh)",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)"
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {suggestions.map((song, idx) => (
            <div
              key={song.id || song.display + idx}
              className="suggestion-item"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(song.display);
              }}
              onClick={() => handleSelect(song.display)}
            >
              <span dir="auto">{reverseHebrewWords(song.display)}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}