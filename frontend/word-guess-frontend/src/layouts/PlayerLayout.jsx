import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";

export function PlayerLayout() {
  return (
    <div className="app-layout player-theme">
      <Navbar />
      <main className="main-content-container">
        <Outlet />
      </main>
    </div>
  );
}
