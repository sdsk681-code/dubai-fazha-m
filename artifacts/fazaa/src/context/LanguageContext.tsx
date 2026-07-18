'use client';
import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'ar' | 'en';

interface LanguageContextValue {
  lang: Lang;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: 'ar', toggle: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');

  // تحميل اللغة المحفوظة
  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'ar' || saved === 'en') setLang(saved);
  }, []);

  // تحديث اتجاه الصفحة عند تغيير اللغة
  useEffect(() => {
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggle = () => setLang(l => (l === 'ar' ? 'en' : 'ar'));

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
