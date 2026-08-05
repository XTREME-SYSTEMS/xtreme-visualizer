import React, { createContext, useContext, useState, useCallback } from "react";

const UICtx = createContext(null);

export function useUI() {
  return useContext(UICtx);
}

export function UIProvider({ children }) {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const openNewProject = useCallback(() => setNewProjectOpen(true), []);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      if (v) setQuery("");
      return !v;
    });
  }, []);

  return (
    <UICtx.Provider
      value={{
        openNewProject,
        openMenu,
        query,
        setQuery,
        searchOpen,
        toggleSearch,
        closeNewProject: () => setNewProjectOpen(false),
        closeMenu: () => setMenuOpen(false),
        newProjectOpen,
        menuOpen,
      }}
    >
      {children}
    </UICtx.Provider>
  );
}