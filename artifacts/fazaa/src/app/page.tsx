import Link from 'next/link';

type Hotspot = {
  card: string;
  label: string;
  top: string;
  left: string;
  width: string;
  height: string;
};

const HOTSPOTS: Hotspot[] = [
  { card: 'fazaa',        label: 'بطاقة فزعة',        top: '44.1%', left: '1.2%',  width: '32.2%', height: '23.1%' },
  { card: 'esaad',        label: 'بطاقة إسعاد',        top: '44.1%', left: '34.6%', width: '32%',   height: '23.1%' },
  { card: 'homat-al-watan', label: 'بطاقة حماة الوطن', top: '44.1%', left: '67.5%', width: '31.8%', height: '23.1%' },
  { card: 'al-saada',     label: 'بطاقة السعادة',      top: '68.1%', left: '15.8%', width: '32.8%', height: '20.1%' },
  { card: 'absher',       label: 'بطاقة أبشر',         top: '68.1%', left: '50.8%', width: '33%',   height: '20.1%' },
];

export default function Home() {
  return (
    <div className="w-full">
      <div className="relative w-full max-w-[1024px] mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/home-poster.jpeg"
          alt="أشهر بطاقات الخصومات في الإمارات"
          fetchPriority="high"
          className="block w-full h-auto"
        />
        {HOTSPOTS.map(h => (
          <Link
            key={h.card}
            href={`/request?card=${h.card}`}
            aria-label={h.label}
            data-testid={`hotspot-${h.card}`}
            className="absolute block"
            style={{
              top: h.top,
              left: h.left,
              width: h.width,
              height: h.height,
              background: 'transparent',
              border: 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
