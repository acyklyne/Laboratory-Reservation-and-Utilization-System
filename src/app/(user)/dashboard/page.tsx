'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Clock, FlaskConical, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/reservation/StatusBadge';

interface Reservation {
  id: string;
  lab: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  createdAt: string;
}

export default function UserDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user's reservations
        const res = await fetch('/api/reservations');
        if (res.ok) {
          const data = await res.json();
          const reservations: Reservation[] = data;
          setRecentReservations(reservations.slice(0, 5));

          // Calculate stats
          setStats({
            total: reservations.length,
            approved: reservations.filter((r) => r.status === 'APPROVED').length,
            rejected: reservations.filter((r) => r.status === 'REJECTED').length,
            pending: reservations.filter((r) => r.status === 'PENDING').length,
          });
        }

        // Get user info from cookie (decoded on server)
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const userData = await meRes.json();
          setUserName(userData.name || 'User');
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Reservations', value: stats.total, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Manage your laboratory bookings and track their status here.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-headline font-bold">{loading ? '...' : stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="font-headline">Recent Reservations</CardTitle>
              <CardDescription>A summary of your latest lab activities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10" asChild>
              <Link href="/my-reservations">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentReservations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No reservations yet.</div>
            ) : (
              <div className="divide-y">
                {recentReservations.map((res) => (
                  <div key={res.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-secondary text-secondary-foreground mt-0.5">
                        <FlaskConical className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{res.lab?.name || 'Unknown Lab'}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {res.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {res.startTime} - {res.endTime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <StatusBadge status={res.status.toLowerCase() as any} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <FlaskConical className="h-32 w-32 rotate-12" />
          </div>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Need to reserve a lab?</CardTitle>
            <CardDescription className="text-white/80">
              Check availability and book a slot for your experiments or classes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button variant="secondary" className="w-full h-11 text-primary font-bold shadow-lg" asChild>
              <Link href="/reserve">Reserve Lab Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
