'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';

export default function App() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  if (status === 'loading') return <div>Loading…</div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <h1 className="text-3xl font-bold">Welcome!</h1>
        <p>Your app is now YouWare-free and working.</p>
      </main>
    </div>
  );
}
