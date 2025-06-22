import React from "react";

export default function StatusMessage({ status }) {
  if (!status) return null;
  return (
    <div style={{
      color: status.startsWith("Failed") ? "#e74c3c" : "#2ecc71",
      marginBottom: 10,
      fontWeight: "bold",
      width: "100%",
      textAlign: "center"
    }}>
      {status}
    </div>
  );
}