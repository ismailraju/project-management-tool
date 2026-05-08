'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/login', '/register'];

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user && !publicPaths.includes(pathname)) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-zinc-50">
        {children}
      </main>
    </div>
  );
}
