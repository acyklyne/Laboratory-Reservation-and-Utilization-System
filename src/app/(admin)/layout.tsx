"use client";

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col w-full min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="bg-secondary p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full space-y-8">
              {children}
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
