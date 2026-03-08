'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function MobileRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      router.replace('/agents');
    }
  }, [router]);

  return null;
}
