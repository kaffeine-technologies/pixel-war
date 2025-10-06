import { useEffect, useState } from "react";
import i18n from "@/i18n";

const languages = [
  { code: "en", label: "🇺🇸" },
  { code: "fr", label: "🇫🇷" },
  { code: "de", label: "🇩🇪" },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("i18nextLng") || i18n.language || "en";
  });

  useEffect(() => {
    i18n.changeLanguage(lang);
    localStorage.setItem("i18nextLng", lang);
  }, [lang]);

  return (
    <div className="inline-flex items-center space-x-3 border border-blue-700 rounded-xl p-2 bg-gradient-to-r from-blue-800 to-indigo-900 shadow-lg">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          className={`px-5 py-2 rounded-lg text-2xl font-semibold transition-colors duration-300 drop-shadow-md ${
            lang === code
              ? "bg-blue-500 text-white shadow-[0_0_10px_#3b82f6]"
              : "text-blue-300 hover:bg-blue-600 hover:text-white"
          }`}
          onClick={() => setLang(code)}
          aria-current={lang === code ? "true" : undefined}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
