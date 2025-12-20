'use client';

import { AuthProvider } from '@/lib/auth';
import { Suspense } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </AuthProvider>
  );
}
