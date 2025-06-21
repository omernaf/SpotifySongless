import React from "react";

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #232526 0%, #414345 100%)"
    }}>
      <div style={{
        background: "rgba(30,32,36,0.97)",
        borderRadius: 20,
        boxShadow: "0 8px 32px 0 rgba(31,38,135,0.37)",
        padding: 40,
        width: 400,
        maxWidth: "95vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div className="loader" style={{
          border: "8px solid #232526",
          borderTop: "8px solid #2ecc71",
          borderRadius: "50%",
          width: 60,
          height: 60,
          animation: "spin 1s linear infinite",
          marginBottom: 24
        }} />
        <div style={{ color: "#fff", fontWeight: "bold", fontSize: 22 }}>
          Loading playlist and preparing your game...
        </div>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg);} 100% {transform: rotate(360deg);} }`}
        </style>
      </div>
    </div>
  );
}