import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navigation/Navbar";

export function AdminLayout() {
  return (
    <div className="app-layout admin-theme">
      <Navbar />
      <main className="main-content-container">
        <Outlet />
      </main>
    </div>
  );
}
