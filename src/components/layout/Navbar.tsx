'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlaskConical, Bell, User, Search, Menu, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

interface UserInfo {
  name: string;
  role: string;
}

export function Navbar() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Logged out', description: 'Redirecting...' });
        router.push('/login');
      }
    } catch {
      // Fallback: just redirect
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-primary text-white px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden text-white hover:bg-white/10" />
        <Link href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2 group">
          <div className="bg-white p-1.5 rounded-lg text-primary">
            <FlaskConical className="h-6 w-6" />
          </div>
          <span className="text-xl font-headline font-bold hidden sm:block">LabReserve</span>
        </Link>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            placeholder="Search laboratories..."
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-white/30 h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="h-8 w-px bg-white/20 mx-1 hidden sm:block" />
        <div className="flex items-center gap-3 pl-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <div className="hidden lg:block text-right">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-white/70 mt-1">{user?.role === 'ADMIN' ? 'Administrator' : 'Student/Faculty'}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full bg-white/10 text-white border border-white/20 h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-white hover:bg-white/10 ml-2"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
