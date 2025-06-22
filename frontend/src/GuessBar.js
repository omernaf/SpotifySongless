import React, { useState } from "react";
import { reverseHebrewWords } from "./utils";

export default function GuessBar({ songs, onGuess, disabled }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);

    // Helper to check if string contains Hebrew
    const isHebrew = (str) => /[\u0590-\u05FF]/.test(str);

    let compareValue = value;
    if (isHebrew(value)) {
      compareValue = reverseHebrewWords(value);
    }

    if (value.length > 0) {
      setSuggestions(
        songs
          .map((s) => s.display)
          .filter((title) =>
            title.toLowerCase().includes(compareValue.toLowerCase())
          )
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (title) => {
    setInput("");           // Clear input after selection
    setSuggestions([]);
    onGuess(title);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuess(input);
    setInput("");           // Clear input after submitting a guess
    setSuggestions([]);
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", marginTop: 16 }}>
      <input
        type="text"
        value={input} // ✅ Show the raw input as typed
        onChange={handleChange}
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
      {suggestions.length > 0 && (
        <div
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
          }}
        >
          {suggestions.map((title) => (
            <div
              key={title}
              onClick={() => handleSelect(title)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <span dir="auto">{reverseHebrewWords(title)}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}