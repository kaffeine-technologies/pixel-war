import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./lang/en-us";
import fr from "./lang/fr";
import de from "./lang/de";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
};

const getInitialLanguage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("i18nextLng") || "en";
  }
  return "en";
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en", 
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
