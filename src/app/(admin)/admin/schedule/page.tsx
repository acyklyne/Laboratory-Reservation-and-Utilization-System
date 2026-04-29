'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface Reservation {
  id: string;
  lab: { name: string };
  user: { name: string };
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
}

const labs = [
  'Ergonomics Laboratory',
  'Digital/Embedded Laboratory',
  'Network Laboratory',
  'Microbiology/Parasitology Lab',
  'WSM Laboratory',
  'Electronics Laboratory',
  'ComLab1',
  'ComLab2',
  'ComLab3',
  'ComLab4',
  'ComLab5',
];

export default function LiveSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReservations() {
      try {
        const params = new URLSearchParams();
        if (selectedLab !== 'all') params.set('labId', selectedLab);
        if (selectedDate) params.set('date', format(selectedDate, 'yyyy-MM-dd'));

        const res = await fetch(`/api/reservations?${params.toString()}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [selectedDate, selectedLab]);

  const timeSlots = [];
  for (let hour = 7; hour < 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">Live Schedule</h1>
          <p className="text-muted-foreground">View all laboratory bookings by date and lab.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedLab} onValueChange={setSelectedLab}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by lab" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Laboratories</SelectItem>
              {labs.map((lab) => (
                <SelectItem key={lab} value={lab}>{lab}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline">
              Schedule for {format(selectedDate, 'PPP')}
            </CardTitle>
            <CardDescription>
              {reservations.length} reservation(s) found
            </CardDescription>
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
              <div className="space-y-2">
                {timeSlots.map((slot) => {
                  const slotReservations = reservations.filter(
                    (r) => r.startTime <= slot && r.endTime > slot
                  );
                  if (slotReservations.length === 0) return null;

                  return (
                    <div key={slot} className="flex items-start gap-4 p-3 rounded-lg border bg-secondary/20">
                      <span className="text-sm font-mono text-muted-foreground w-16 pt-0.5">{slot}</span>
                      <div className="flex-1 space-y-2">
                        {slotReservations.map((res) => (
                          <div key={res.id} className="p-3 bg-white rounded-lg border shadow-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-foreground">{res.lab.name}</p>
                                <p className="text-sm text-muted-foreground">{res.user.name} • {res.purpose}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                res.status === 'APPROVED' ? 'bg-primary/10 text-primary' :
                                res.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-600' :
                                'bg-destructive/10 text-destructive'
                              }`}>
                                {res.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {res.startTime} - {res.endTime}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
