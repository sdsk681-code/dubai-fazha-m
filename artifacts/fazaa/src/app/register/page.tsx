'use client';
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const brand = searchParams.get('brand') || 'fazaa';
    const type = searchParams.get('type') || 'gold';
    router.replace(`/order?brand=${brand}&type=${type}`);
  }, [searchParams, router]);

  return null;
}

export default function Register() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}
