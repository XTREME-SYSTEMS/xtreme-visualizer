import React from "react";
import { Outlet } from "react-router-dom";
import { UIProvider, useUI } from "@/lib/uiContext";
import TopBar from "@/components/vq/TopBar";
import BottomNav from "@/components/vq/BottomNav";
import NewProjectSheet from "@/components/vq/NewProjectSheet";
import MenuSheet from "@/components/vq/MenuSheet";

function Shell() {
  const { newProjectOpen, menuOpen, closeNewProject, closeMenu, searchOpen, query, setQuery } = useUI();
  return (
    <div className="xv-app">
      <div className="page">
        <TopBar />
        {searchOpen && (
          <div className="searchbar">
            <input
              placeholder="Search projects, locations, systems…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}
        <Outlet />
      </div>
      <BottomNav />
      {newProjectOpen && <NewProjectSheet onClose={closeNewProject} />}
      {menuOpen && <MenuSheet onClose={closeMenu} />}
    </div>
  );
}

export default function Layout() {
  return (
    <UIProvider>
      <Shell />
    </UIProvider>
  );
}