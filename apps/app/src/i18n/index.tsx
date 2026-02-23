import React, { createContext, useContext, useState, useEffect } from "react";
import enMessages from "../messages/en.json";
import zhMessages from "../messages/zh.json";

type Messages = typeof enMessages;
type Locale = "en" | "zh";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const messages: Record<Locale, Messages> = {
  en: enMessages,
  zh: zhMessages,
};

/**
 * Get the current locale from localStorage or default to browser language
 */
function getCurrentLocale(): Locale {
  const savedLocale = localStorage.getItem("locale") as Locale;
  if (savedLocale && (savedLocale === "en" || savedLocale === "zh")) {
    return savedLocale;
  }
  // Default to browser language or English
  return navigator.language.startsWith("zh") ? "zh" : "en";
}

/**
 * Translate a key using the current locale from localStorage
 * This can be used outside of React components
 */
export function translate(key: string, locale?: Locale): string {
  const currentLocale = locale ?? getCurrentLocale();
  const keys = key.split(".");
  let value: unknown = messages[currentLocale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    // Get saved locale from localStorage or detect from browser
    const savedLocale = localStorage.getItem("locale") as Locale;
    if (savedLocale && (savedLocale === "en" || savedLocale === "zh")) {
      setLocaleState(savedLocale);
    } else {
      // Detect from browser
      const browserLocale = navigator.language.startsWith("zh") ? "zh" : "en";
      setLocaleState(browserLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages[locale];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
