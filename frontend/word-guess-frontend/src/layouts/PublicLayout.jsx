import React from "react";
import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <div className="min-vh-100 d-flex flex-column justify-content-between bg-light" style={{ background: "radial-gradient(circle at top, #eef2ff 0%, #f8fafc 100%)" }}>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-3 p-sm-4">
        <div className="w-100" style={{ maxWidth: "460px" }}>
          <Outlet />
        </div>
      </div>
      <footer className="text-center py-3 text-muted small">
        <p className="mb-0">© Guess the Word. All rights reserved.</p>
      </footer>
    </div>
  );
}
