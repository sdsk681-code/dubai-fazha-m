'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { BRANDS, type BrandKey, type CardTypeKey } from '@/data/brands';
import { useLang } from '@/context/LanguageContext';
import { t, brandsI18n } from '@/i18n';

function CardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLang();
  const T = t[lang].cards;

  const brandKey = (searchParams.get('brand') || 'fazaa') as BrandKey;
  const brand = BRANDS[brandKey] || BRANDS.fazaa;
  const bi = brandsI18n[lang][brandKey];

  return (
    <div className="w-full">
      {/* رأس العلامة */}
      <div
        className="w-full py-6 px-4"
        style={{ background: `linear-gradient(135deg, ${brand.darkColor} 0%, ${brand.color} 100%)` }}
      >
        <div className="max-w-[960px] mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-white/80 hover:text-white flex items-center gap-1 text-sm transition-colors cursor-pointer"
          >
            <ChevronRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
            {T.back}
          </button>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {lang === 'ar' ? `بطاقات ${brand.name}` : `${brand.nameEn} Cards`}
            </h1>
            <p className="text-white/70 text-xs font-sans mt-0.5">({brand.nameEn})</p>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base border-2 border-white/30 bg-white/15">
            {brand.nameEn.slice(0, 2)}
          </div>
        </div>
        <div className="max-w-[960px] mx-auto mt-3 flex flex-wrap gap-2 justify-center">
          <span className="text-white/70 text-xs mx-1">{bi.description} •</span>
          {bi.eligibility.map((item, i) => (
            <span key={i} className="text-xs px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* تنبيه */}
      <div className="max-w-[960px] mx-auto px-4 pt-5">
        <p className="text-[11px] text-gray-400 text-center border border-gray-200 rounded-lg px-4 py-2 bg-gray-50">
          ⚠️ {T.disclaimer}
        </p>
      </div>

      {/* شبكة البطاقات */}
      <div className="max-w-[960px] mx-auto px-4 py-7">
        <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
          {brand.cards.map(card => {
            const ci = bi.cards[card.id as CardTypeKey];
            return (
              <CardItem
                key={card.id}
                brand={brand}
                cardId={card.id as CardTypeKey}
                image={card.image}
                price={card.price}
                displayName={ci.displayName}
                description={ci.description}
                badge={ci.badge}
                benefits={ci.benefits}
              />
            );
          })}
        </div>
      </div>

      {/* مميزات */}
      <div className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-[960px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
          {T.features.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{f.icon}</span>
              <p className="font-bold text-gray-800 text-sm">{f.title}</p>
              <p className="text-gray-500 text-xs">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="py-4 px-4 text-center"
        style={{ background: `linear-gradient(90deg, ${brand.darkColor}, ${brand.color})` }}
      >
        <p className="text-white font-bold text-base">{T.cta}</p>
      </div>
    </div>
  );
}

function CardItem({
  brand, cardId, image, price, displayName, description, badge, benefits,
}: {
  brand: (typeof BRANDS)[BrandKey];
  cardId: CardTypeKey;
  image: string;
  price: string;
  displayName: string;
  description: string;
  badge?: string;
  benefits: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLang();
  const T = t[lang].cards;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200 relative">
      {badge && (
        <div className="absolute top-3 start-3 z-10 bg-[#e63946] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow">
          {badge}
        </div>
      )}
      <div className="p-4 flex flex-col h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={displayName} className="w-full rounded-xl object-cover mb-4" style={{ aspectRatio: '85/54' }} loading="lazy" />
        <div className="text-center mb-1">
          <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
        </div>
        <p className="text-gray-600 text-sm text-center mb-2">{description}</p>
        <p className="text-center text-[#c9a227] font-bold text-sm mb-4">{price}</p>

        {expanded && (
          <ul className="space-y-1.5 mb-4 border-t border-gray-100 pt-3">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center justify-end gap-2 text-[13px] text-gray-700">
                <span>{b}</span>
                <span className="text-green-500 font-bold text-base leading-none shrink-0">✓</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          <Link
            href={`/order?brand=${brand.key}&type=${cardId}`}
            className="block w-full text-center bg-[#c9a227] hover:bg-[#b8943f] text-white font-bold py-2.5 rounded-xl transition-colors shadow-sm text-[15px] mb-2"
          >
            {T.orderNow}
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 text-[#c9a227] hover:text-[#b8943f] text-sm font-medium transition-colors cursor-pointer py-1"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span>{expanded ? T.showLess : T.showMore}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cards() {
  return <Suspense><CardsContent /></Suspense>;
}
