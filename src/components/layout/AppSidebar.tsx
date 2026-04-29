'use client';

import {
  LayoutDashboard,
  CalendarCheck,
  History,
  Settings,
  ShieldCheck,
  BarChart3,
  Layers,
  LogOut,
  Microscope,
  FlaskConical,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UserInfo {
  name: string;
  role: string;
}

const userNavItems = [
  { title: 'Home', icon: LayoutDashboard, url: '/' }  , //filler child
  { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
  { title: 'Reserve Lab', icon: CalendarCheck, url: '/reserve' },
  { title: 'Reservations', icon: History, url: '/my-reservations' },
  
];

const adminNavItems = [
  { title: 'Overview', icon: BarChart3, url: '/admin/dashboard' },
  { title: 'Manage Requests', icon: Layers, url: '/admin/reservations' },
  { title: 'Live Schedule', icon: Microscope, url: '/admin/schedule' },
  { title: 'Usage Reports', icon: ShieldCheck, url: '/admin/reports' },
  { title: 'Admin Management', icon: Settings, url: '/admin/admin-management' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);

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
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast({ title: 'Logged out', description: 'Redirecting...' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-4 md:hidden">
        <span className="font-headline font-bold text-primary">LabReserve Hub</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>User Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.url)}
                        tooltip={item.title}
                        className="data-[active=true]:bg-primary/10"
                      >
                        <Link href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Logout"
              className="text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <Link href="#">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
