import React from "react";

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #121316 0%, #1c1e24 100%)"
    }}>
      <div style={{
        background: "rgba(26, 28, 34, 0.96)",
        borderRadius: 24,
        boxShadow: "0 12px 40px 0 rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 94, 58, 0.15)",
        border: "1px solid rgba(255, 94, 58, 0.12)",
        padding: "44px 36px",
        width: 400,
        maxWidth: "92vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
      }}>
        <div className="loader" style={{
          border: "6px solid #1e2026",
          borderTop: "6px solid #FF7A00",
          borderRight: "6px solid #FF5E3A",
          borderRadius: "50%",
          width: 54,
          height: 54,
          animation: "spin 0.9s linear infinite",
          marginBottom: 20
        }} />
        <div style={{
          color: "#fff",
          fontWeight: "700",
          fontSize: 18,
          textAlign: "center",
          letterSpacing: "-0.2px"
        }}>
          Loading playlist and preparing game...
        </div>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg);} 100% {transform: rotate(360deg);} }`}
        </style>
      </div>
    </div>
  );
}