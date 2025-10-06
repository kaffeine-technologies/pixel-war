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
    <div className="flex space-x-2 justify-center">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors duration-300 ${
            lang === code
              ? "bg-blue-500 text-white shadow-md"
              : "text-blue-300 hover:bg-blue-600 hover:text-white"
          }`}
          onClick={() => setLang(code)}
          aria-current={lang === code ? "true" : undefined}
          type="button"
          title={`Switch language to ${code.toUpperCase()}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
