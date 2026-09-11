import React from "react";

export function LoadingScreen({ message = "Initializing application..." }) {
  return (
    <div className="loading-screen">
      <div className="spinner-container">
        <div className="spinner"></div>
        <h2 className="loading-title">Guess the Word</h2>
        <p className="loading-subtitle">{message}</p>
      </div>
    </div>
  );
}
