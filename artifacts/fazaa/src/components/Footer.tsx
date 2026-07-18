'use client';
import Link from 'next/link';
import { useLang } from '@/context/LanguageContext';
import { t } from '@/i18n';

export default function Footer() {
  const { lang } = useLang();
  const T = t[lang].footer;

  return (
    <footer className="bg-[#1a1a1a] text-gray-400 py-8 px-6 md:px-12 w-full mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">{T.privacy}</Link>
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">{T.terms}</Link>
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">{T.support}</Link>
          <Link href="/" className="hover:text-white transition-colors cursor-pointer">{T.faq}</Link>
        </div>
        <div className="text-sm flex items-center gap-2">
          <span className="text-white font-bold">{T.brand}</span>
          <span>|</span>
          <span>{T.rights}</span>
        </div>
      </div>
    </footer>
  );
}
