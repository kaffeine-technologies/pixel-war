import React, { useState } from "react";
import LanguageSwitcher from "../molecules/change-lang";

const CanvasTopMenu: React.FC<{
  onQuit: () => void;
  onHelpToggle: () => void;
  t: (key: string) => string;
}> = ({ onQuit, onHelpToggle, t }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex items-center justify-between bg-blue-950 px-4 py-3 shadow-lg sticky top-0 z-50">
      <h1 className="text-2xl sm:text-4xl font-extrabold font-mono tracking-wide animate-blue-glow text-white">
        {t("canvas.menuTitle")}
      </h1>

      {/* Desktop menu */}
      <div className="hidden sm:flex items-center space-x-3">
        <LanguageSwitcher />
        <button
          aria-label={t("canvas.helpTitle")}
          onClick={onHelpToggle}
          title={t("canvas.helpTitle")}
          className="text-lg sm:text-2xl bg-blue-700 hover:bg-blue-800 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-md active:scale-95"
          type="button"
        >
          ?
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md shadow-md font-semibold active:scale-95"
          onClick={onQuit}
        >
          {t("canvas.quit")}
        </button>
      </div>

      {/* Mobile hamburger */}
      <div className="sm:hidden relative">
        <button
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="text-white text-3xl px-2 py-1 focus:outline-none"
        >
          &#9776;
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-blue-900 rounded-md shadow-lg flex flex-col space-y-2 p-3 z-50">
            <div onClick={closeMenu}>
              <LanguageSwitcher />
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md font-semibold w-full"
              onClick={() => {
                onQuit();
                closeMenu();
              }}
            >
              {t("canvas.quit")}
            </button>
            <button
              aria-label={t("canvas.helpTitle")}
              onClick={() => {
                onHelpToggle();
                closeMenu();
              }}
              className="text-lg bg-blue-700 hover:bg-blue-800 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              type="button"
            >
              ?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasTopMenu;
