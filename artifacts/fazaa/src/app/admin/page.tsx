'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { BRANDS, type BrandKey } from '@/data/brands';
import { listRegistrations, updateRegistrationStatus } from '@/lib/firebase';

type Reg = {
  id: string;
  fullName: string;
  phone: string;
  emiratesId: string;
  brand: string;
  cardType: string;
  region: string;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'موافق عليه',   color: 'bg-green-100  text-green-800'  },
  rejected: { label: 'مرفوض',        color: 'bg-red-100    text-red-800'    },
};

const BRAND_NAMES: Record<string, string> = {
  fazaa: 'فزعة', esaad: 'إسعاد', homat: 'حماة الوطن', alsaada: 'السعادة', absher: 'أبشر',
};
const CARD_NAMES: Record<string, string> = {
  gold: 'الذهبية', silver: 'الفضية', discount: 'الخصومات',
};

export default function Admin() {
  const [rows, setRows]       = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const [filter, setFilter]   = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [error, setError]     = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const data = await listRegistrations();
      setRows(data);
      setError('');
    } catch (err) {
      setError('تعذّر تحميل البيانات. تحقق من إعدادات Firebase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 4000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const handle = async (id: string, status: 'approved' | 'rejected') => {
    setActing(id);
    try {
      await updateRegistrationStatus(id, status);
      await fetchAll();
    } finally {
      setActing(null);
    }
  };

  const visible = rows.filter(r => filter === 'all' || r.status === filter);
  const pending  = rows.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#f5f5f5]" dir="rtl">
      <div className="w-full px-6 py-4 flex items-center justify-between shadow-sm" style={{ background: 'linear-gradient(to left, #7a6318, #c9a227)' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-xl">لوحة تحكم</span>
          {pending > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pending} جديد
            </span>
          )}
        </div>
        <span className="text-white/80 text-sm">إدارة طلبات البطاقات</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {(['pending','approved','rejected','all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-[#c9a227] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#c9a227]'
              }`}
            >
              { f === 'pending' ? `قيد الانتظار (${rows.filter(r=>r.status==='pending').length})`
              : f === 'approved' ? 'موافق عليه'
              : f === 'rejected' ? 'مرفوض'
              : 'الكل' }
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-[#c9a227]/30 border-t-[#c9a227] animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-lg">لا توجد طلبات</div>
        ) : (
          <div className="space-y-4">
            {visible.map(r => {
              const s = STATUS_LABEL[r.status] ?? STATUS_LABEL.pending;
              const brand = BRANDS[r.brand as BrandKey];
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-lg">{r.fullName}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                        <span>📞 {r.phone}</span>
                        <span>🪪 {r.emiratesId}</span>
                        <span>📍 {r.region}</span>
                      </div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
                          style={{ background: `linear-gradient(135deg, ${brand?.darkColor ?? '#555'}, ${brand?.color ?? '#888'})` }}
                        >
                          {BRAND_NAMES[r.brand] ?? r.brand}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                          {CARD_NAMES[r.cardType] ?? r.cardType}
                        </span>
                        <span className="text-xs text-gray-400 self-center">
                          {new Date(r.createdAt).toLocaleString('ar-AE')}
                        </span>
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handle(r.id, 'approved')}
                          disabled={acting === r.id}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm"
                        >
                          {acting === r.id ? '...' : 'موافق ✓'}
                        </button>
                        <button
                          onClick={() => handle(r.id, 'rejected')}
                          disabled={acting === r.id}
                          className="bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm"
                        >
                          {acting === r.id ? '...' : 'رفض ✗'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
