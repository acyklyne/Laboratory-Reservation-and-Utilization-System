'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/reservation/StatusBadge';
import { Search, Info, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Reservation {
  id: string;
  lab: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filtered, setFiltered] = useState<Reservation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await fetch('/api/reservations');
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
          setFiltered(data);
        }
      } catch (error) {
        console.error('Fetch reservations error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!search) {
      setFiltered(reservations);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      reservations.filter(
        (r) =>
          r.lab?.name?.toLowerCase().includes(q) ||
          r.date.includes(q)
      )
    );
  }, [search, reservations]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold text-foreground">My Reservations</h1>
        <p className="text-muted-foreground">Track the status of your laboratory booking requests.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="font-headline">Activity History</CardTitle>
            <CardDescription>All your lab requests in one place.</CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by lab or date..."
              className="pl-10 bg-secondary/50 border-none h-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading reservations...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'No reservations match your search.' : 'No reservations yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-secondary/30">
                <TableRow className="border-none">
                  <TableHead className="font-bold">Laboratory</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Time</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((res) => (
                  <TableRow key={res.id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell className="font-semibold text-foreground">{res.lab?.name || 'Unknown'}</TableCell>
                    <TableCell>{res.date}</TableCell>
                    <TableCell>{res.startTime} - {res.endTime}</TableCell>
                    <TableCell>
                      <StatusBadge status={res.status.toLowerCase()} />
                    </TableCell>
                    <TableCell>
                      {res.adminNotes ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Info className="h-3 w-3 text-blue-600" />
                          <span className="line-clamp-1">{res.adminNotes}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No notes provided</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
