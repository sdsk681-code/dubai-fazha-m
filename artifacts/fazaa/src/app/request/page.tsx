'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const CARD_TO_BRAND: Record<string, string> = {
  fazaa: 'fazaa',
  esaad: 'esaad',
  'homat-al-watan': 'homat',
  'al-saada': 'alsaada',
  absher: 'absher',
};

function RequestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const card = searchParams?.get('card') || 'fazaa';
    const brand = CARD_TO_BRAND[card] || 'fazaa';
    router.replace(`/cards?brand=${brand}`);
  }, [searchParams, router]);

  return null;
}

export default function Request() {
  return (
    <Suspense>
      <RequestContent />
    </Suspense>
  );
}
