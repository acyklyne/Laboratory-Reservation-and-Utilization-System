'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/reservation/StatusBadge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { FlaskConical, Loader2, Clock, CalendarIcon, User, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Reservation {
  id: string;
  lab: { id: string; name: string };
  user: { id: string; name: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
}

interface Lab {
  id: string;
  name: string;
}

export default function LiveSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [labsLoading, setLabsLoading] = useState(true);

  // Fetch labs for filter
  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch('/api/labs', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setLabs(data);
        }
      } catch (error) {
        console.error('Fetch labs error:', error);
      } finally {
        setLabsLoading(false);
      }
    }
    fetchLabs();
  }, []);

  // Fetch reservations
  useEffect(() => {
    async function fetchReservations() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedLab !== 'all') params.set('labId', selectedLab);
        if (selectedDate) params.set('date', format(selectedDate, 'yyyy-MM-dd'));

        const res = await fetch(`/api/reservations?${params.toString()}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          // Sort by date then start time
          const sorted = data.sort((a: Reservation, b: Reservation) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.startTime.localeCompare(b.startTime);
          });
          setReservations(sorted);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [selectedDate, selectedLab]);

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  // Filter computer labs for the dropdown
  const computerLabs = labs.filter((lab) =>
    lab.name.toLowerCase().includes('computer laboratory')
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">Live Schedule</h1>
          <p className="text-muted-foreground">View all laboratory bookings by date and lab.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedLab} onValueChange={setSelectedLab} disabled={labsLoading}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Laboratories</SelectItem>
              {computerLabs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              showOutsideDays={false}
              className="rounded-md border"
              classNames={{
                day_disabled: 'opacity-40 cursor-not-allowed bg-muted line-through',
                day: 'h-9 w-9 p-0 font-normal',
                day_today: 'font-semibold',
              }}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline">
                  Schedule for {format(selectedDate, 'PPP')}
                </CardTitle>
                <CardDescription>
                  {reservations.length} reservation(s) found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading schedule...</span>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No reservations for this date.
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/admin/reservations`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="h-4 w-4 text-primary" />
                          <p className="font-semibold text-foreground">{res.lab.name}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>{res.user.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatTime(res.startTime)} - {formatTime(res.endTime)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            <span className="max-w-[200px] truncate">{res.purpose}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{res.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={res.status.toLowerCase()} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
