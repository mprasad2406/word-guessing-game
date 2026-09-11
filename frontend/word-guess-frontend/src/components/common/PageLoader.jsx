import React from "react";

export function PageLoader({ text = "Loading..." }) {
  return (
    <div className="page-loader">
      <div className="spinner-small"></div>
      <span className="page-loader-text">{text}</span>
    </div>
  );
}
